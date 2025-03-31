use actix_web::{post, web, App, HttpServer, Responder, HttpResponse};
use actix_cors;
use r2d2_sqlite::SqliteConnectionManager;
use r2d2::Pool;
use rusqlite::params;
use serde::{Deserialize, Serialize};


#[derive(Serialize, Deserialize)]
struct NewUser {
    name: String,
    score: i32,
}

#[derive(Serialize, Deserialize)]
struct User {
    name: String,
    score: i32,
    rank: i32,
}

// Creating connection pool
struct AppState {
    db_pool: Pool<SqliteConnectionManager>,
}

// Insert new score from user
async fn create_score(
    state: web::Data<AppState>,
    user: web::Json<NewUser>
) -> impl Responder {
    let conn = state.db_pool.get().expect("Failed to get connection");


    let result = conn.execute(
        "INSERT INTO users (name, score) VALUES (?1, ?2)",
        params![&user.name, &user.score]
    );

    match result {
        Ok(_) => HttpResponse::Ok().finish(),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

// Get all scores and add rank from database
async fn get_scores(
    state: web::Data<AppState>
) -> impl Responder {
    let conn = state.db_pool.get().expect("Failed to get connection");

    let mut scores = conn.prepare("WITH top_scores AS (
    	   SELECT DISTINCT score FROM users ORDER BY score DESC LIMIT 10
    	)
	 SELECT name, score, RANK() OVER (ORDER BY score DESC) AS rank 
	 FROM users WHERE score IN (SELECT score FROM top_scores)
	 ORDER BY score DESC LIMIT 10;
	")
        .expect("Failed to prepare statement");

    let score_iter = scores.query_map([], |row| {
        Ok(User {
            name: row.get(0)?,
            score: row.get(1)?,
            rank: row.get(2)?
        })
    });

    match score_iter {
        Ok(users) =>  {
            let users: Result<Vec<User>, _> = users.collect();
            match users {
                Ok(users) => HttpResponse::Ok().json(users),
                Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
            }
        }
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

#[post("/")]
async fn echo(req_body: String) -> impl Responder {
    HttpResponse::Ok().body(req_body)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Connect to sqlite
    let manager  = SqliteConnectionManager::file("data/score.db");
    let pool = Pool::new(manager).expect("Failed to create pool");

    // Initialize database
    let conn = pool.get().expect("Failed to get connection");
    conn.execute("
        CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        score INTEGER NOT NULL
    );
    ", []).expect("Failed to create table");

    HttpServer::new( move || {
        // Configure CORS
        let cors = actix_cors::Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header();
        
        App::new()
            .wrap(cors)
            .app_data(web::Data::new(AppState { db_pool: pool.clone() }))
            .service(echo)
            .route("/scores", web::get().to(get_scores))
            .route("/scores", web::post().to(create_score))
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
