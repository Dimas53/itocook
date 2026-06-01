from fastapi import FastAPI

app = FastAPI(
    title="ItoCook API",
    description="Микросервис для расчётов и бизнес-логики ItoCook",
    version="0.1.0",
)


@app.get("/")
def root():
    return {"message": "ItoCook API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "itocook-api"}
