import { NextResponse } from 'next/server'

export async function GET() {
  const jwtSecret = process.env.JWT_SECRET

  return NextResponse.json({
    hasJwtSecret: !!jwtSecret,
    secretLength: jwtSecret?.length || 0,
    // Never return the actual secret!
    secretPreview: jwtSecret ? `${jwtSecret.substring(0, 8)}...` : 'Not found',
  })
}
