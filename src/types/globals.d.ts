export {}

// Create a type for the roles
export type Roles = "admin" | "university_admin_staff" | "faculty"

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
    }
  }
}
