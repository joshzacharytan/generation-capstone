# Project Requirements

This document outlines the current state and future requirements for the GenerationsG Capstone project.

## Backend (Completed)

*   **User Management:**
    *   User profile management (change password, change email, delete account).
*   **Admin Features (Vendor/Company):**
    *   API endpoints for administrative tasks.
    *   Inventory management APIs (add, update products).
    *   Generative AI integration for product descriptions.
*   **Super User Admin Features:**
    *   API endpoints for viewing all tenant information.
*   **Database Migrations:**
    *   Alembic removed (manual migrations/schema management).

## Frontend (To Be Implemented)

*   **Technology Stack:** React (as indicated by `client` directory setup).
*   **Admin Frontend (Vendor/Company):**
    *   **User Account Management:**
        *   Interface to change password.
        *   Interface to change email.
        *   Interface to delete account.
    *   **Inventory Management:**
        *   Form to add new products.
        *   Functionality to update existing products.
        *   Integration with generative AI for product description creation.
        *   Ability to upload product photos.
*   **Admin Frontend (Super User):**
    *   Dashboard/page to view information for all tenants.
*   **Company Frontend Template (Customer-facing Shop):**
    *   **Shop Display:**
        *   Template to showcase how a company's shop looks online.
    *   **Shopping Cart & Checkout:**
        *   Product ordering process.
        *   Shopping cart view.
        *   Ability to edit cart contents.
        *   Checkout process.