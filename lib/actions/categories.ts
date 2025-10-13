"use server";

import { db } from "@/lib/firebase/client";
import type { Category, CreateCategoryInput } from "@/lib/types/session";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

export const createCategory = async (input: CreateCategoryInput) => {
  try {
    const categoryRef = await addDoc(
      collection(db, "sessions", input.sessionId, "categories"),
      {
        sessionId: input.sessionId,
        name: input.name,
        color: input.color ?? "#3b82f6",
        order: input.order ?? 0,
        maxEntriesPerPerson: input.maxEntriesPerPerson,
      },
    );
    return { categoryId: categoryRef.id };
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};

export const getCategory = async (
  sessionId: string,
  categoryId: string,
): Promise<Category | null> => {
  try {
    const categoryRef = doc(
      db,
      "sessions",
      sessionId,
      "categories",
      categoryId,
    );
    const categoryDoc = await getDoc(categoryRef);

    if (!categoryDoc.exists()) {
      return null;
    }

    const data = categoryDoc.data();
    return {
      id: categoryDoc.id,
      sessionId: data.sessionId as string,
      name: data.name as string,
      color: data.color as string,
      order: (data.order as number) ?? 0,
      maxEntriesPerPerson: data.maxEntriesPerPerson as number | undefined,
    } as Category;
  } catch (error) {
    console.error("Error getting category:", error);
    throw error;
  }
};

export const getSessionCategories = async (
  sessionId: string,
): Promise<Category[]> => {
  try {
    const categoriesQuery = collection(
      db,
      "sessions",
      sessionId,
      "categories",
    );
    const snapshot = await getDocs(categoriesQuery);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        sessionId: data.sessionId as string,
        name: data.name as string,
        color: data.color as string,
        order: (data.order as number) ?? 0,
        maxEntriesPerPerson: data.maxEntriesPerPerson as number | undefined,
      } as Category;
    });
  } catch (error) {
    console.error("Error getting session categories:", error);
    throw error;
  }
};

export const updateCategory = async (
  sessionId: string,
  categoryId: string,
  updates: Partial<Omit<Category, "id" | "sessionId">>,
) => {
  try {
    const categoryRef = doc(
      db,
      "sessions",
      sessionId,
      "categories",
      categoryId,
    );
    await updateDoc(categoryRef, updates);
    return { success: true };
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

export const deleteCategory = async (sessionId: string, categoryId: string) => {
  try {
    const categoryRef = doc(
      db,
      "sessions",
      sessionId,
      "categories",
      categoryId,
    );
    await deleteDoc(categoryRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};
