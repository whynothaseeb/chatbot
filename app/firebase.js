// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
 apiKey: "AIzaSyAC_Spi3AddAQHeA97pqXSfuEnJbw0eudU",
  authDomain: "securabot-f9f3b.firebaseapp.com",
  databaseURL: "https://securabot-f9f3b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "securabot-f9f3b",
  storageBucket: "securabot-f9f3b.appspot.com",
  messagingSenderId: "738892325450",
  appId: "1:738892325450:web:c305fdd07915ab4ccb3cb3",
  measurementId: "G-K1MTX9M7WK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};

const signOutUser = async () => {
  await signOut(auth);
};

const saveConversation = async (userId, conversation) => {
};

const fetchConversations = async (userId) => {
  return;
};

const deleteConversation = async (userId, conversationId) => {
  const conversationDocRef = doc(firestore, 'users', userId, 'conversations', conversationId);
  await deleteDoc(conversationDocRef);
};
const getUserProfilePic = async (userId) => {
  const user = auth.currentUser;
  return user?.photoURL || ''; // Return the photoURL if available, otherwise an empty string
};

export { auth, signInWithGoogle, signOutUser, saveConversation, fetchConversations, deleteConversation, getUserProfilePic };
