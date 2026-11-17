
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { ServiceAccount } from "firebase-admin";
import serviceAccount from "../../credentials/serviceAccountKey.json" with { type: "json" };

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount as ServiceAccount)
    });
}

export const firestore = getFirestore();

export const connectFirestore = async (): Promise<void> => {
    try {
        // Test Firestore connectivity by executing a query
        await firestore.listCollections();

        console.log("Firebase Firestore connected successfully!");
    } catch (error) {
        console.error("Firebase Firestore connection failed:", error);
        throw error;
    }
};
