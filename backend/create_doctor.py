"""Provision a doctor account from the backend folder using hidden password input."""
from getpass import getpass

import auth
import models
from database import SessionLocal
from migrations import run_migrations


def main():
    run_migrations()
    email = input("Doctor email: ").strip().lower()
    if "@" not in email:
        raise SystemExit("Enter a valid email address.")
    full_name = input("Doctor display name: ").strip()
    password = getpass("Password (at least 8 characters): ")
    if len(password) < 8:
        raise SystemExit("Password must be at least 8 characters.")

    db = SessionLocal()
    try:
        if db.query(models.User).filter(models.User.email == email).first():
            raise SystemExit("An account already exists for that email.")
        doctor = models.User(email=email, full_name=full_name or None, hashed_password=auth.hash_password(password), role=models.RoleEnum.DOCTOR)
        db.add(doctor)
        db.commit()
        print(f"Doctor account created for {email}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
