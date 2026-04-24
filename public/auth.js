import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// TODO: Kendi Firebase konfigürasyonunuzu buraya ekleyin
const firebaseConfig = {
    apiKey: "AIzaSyB8Zd52Zh85BL7nBTTjbqG5UIkM7Kao7o0",
    authDomain: "sibersecurity-e2321.firebaseapp.com",
    databaseURL: "https://sibersecurity-e2321-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "sibersecurity-e2321",
    storageBucket: "sibersecurity-e2321.firebasestorage.app",
    messagingSenderId: "922930465624",
    appId: "1:922930465624:web:c6630d391f1c0c9b5cb32d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/**
 * Giriş yapma fonksiyonu
 */
export async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error("Giriş hatası:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Çıkış yapma fonksiyonu
 */
export async function logout() {
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error("Çıkış hatası:", error);
    }
}

/**
 * Auth durumunu kontrol et
 */
export function checkAuth(redirectIfNoUser = true) {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                resolve(user);
            } else {
                if (redirectIfNoUser && !window.location.pathname.includes('login.html')) {
                    window.location.href = 'login.html';
                }
                resolve(null);
            }
        });
    });
}
