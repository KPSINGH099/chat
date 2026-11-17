import { connectFirestore } from "./firebase.js"; // Change "./firebase" to your actual file path

async function runTest() {
    try {
        console.log("Testing Firestore connection...");
        await connectFirestore();
        process.exit(0); // Force exit so Firebase open handles don't keep the terminal hanging
    } catch (error) {
        process.exit(1);
    }
}

runTest();