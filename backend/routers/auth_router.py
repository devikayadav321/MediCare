from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/me")
def current_user(current_user: models.User = Depends(auth.get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "name": current_user.full_name, "role": current_user.role.value}

@router.post("/register", response_model=schemas.Token)
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    if user_data.role != "patient":
        raise HTTPException(status_code=403, detail="Doctor accounts must be provisioned by an administrator.")
    email = str(user_data.email).lower()
    existing_user = db.query(models.User).filter(models.User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = auth.hash_password(user_data.password)
    new_user = models.User(email=email, full_name=(user_data.full_name or "").strip() or None, hashed_password=hashed_pwd, role=user_data.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=schemas.Token)
def login_user(form_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == str(form_data.email).lower()).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
