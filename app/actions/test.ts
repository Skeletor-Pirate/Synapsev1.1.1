'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function testServerAction() {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.length;
}
