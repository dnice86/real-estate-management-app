// Remove this line:
// import { updateSession } from '@/middleware'
import { type NextRequest } from 'next/server'

// Define updateSession in this file
export function updateSession(request: NextRequest) {
  // Your updateSession logic here
}

export async function middleware(request: NextRequest) {
  // Your middleware logic here, which can now call updateSession
}