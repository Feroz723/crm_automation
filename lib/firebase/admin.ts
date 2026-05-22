import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

let adminApp: App

function getAdminApp() {
    if (getApps().length === 0) {
        adminApp = initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                // The private key comes as a string with escaped newlines from env
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        })
    } else {
        adminApp = getApps()[0]
    }
    return adminApp
}

export async function verifyIdToken(token: string) {
    try {
        const app = getAdminApp()
        const decodedToken = await getAuth(app).verifyIdToken(token)
        return { user: decodedToken, error: null }
    } catch (error: any) {
        return { user: null, error: error.message }
    }
}
