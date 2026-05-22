import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOutMethod,
    onAuthStateChanged,
    User,
} from 'firebase/auth'
import { auth } from './config'

export async function firebaseSignUp(email: string, password: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const idToken = await userCredential.user.getIdToken()
    return { user: userCredential.user, idToken }
}

export async function firebaseSignIn(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const idToken = await userCredential.user.getIdToken()
    return { user: userCredential.user, idToken }
}

export async function firebaseSignOut() {
    await firebaseSignOutMethod(auth)
    // Clear the auth cookie
    document.cookie = 'fb-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
}

export function onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback)
}

export { auth }
