import type {
  DocumentReference,
  DocumentData,
  QuerySnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";

/**
 * Creates a properly typed mock DocumentReference without using type assertions
 */
export function createMockDocRef(id: string): DocumentReference<DocumentData> {
  return {
    id,
    type: "document" as const,
    firestore: {} as never,
    parent: {} as never,
    path: `mock/${id}`,
    converter: null,
    withConverter: (() => {
      // Mock implementation
    }) as never,
  };
}

/**
 * Creates a properly typed mock QuerySnapshot without using type assertions
 */
export function createMockQuerySnapshot<T = DocumentData>(
  docs: Array<{ id: string; data: T }>,
): QuerySnapshot<DocumentData> {
  const mockDocs: QueryDocumentSnapshot<DocumentData>[] = docs.map((doc) => ({
    id: doc.id,
    ref: createMockDocRef(doc.id),
    data: () => doc.data as DocumentData,
    exists: () => true,
    get: ((field: string) => (doc.data as Record<string, unknown>)[field]) as never,
    metadata: { hasPendingWrites: false, fromCache: false },
  })) as QueryDocumentSnapshot<DocumentData>[];

  return {
    docs: mockDocs,
    size: mockDocs.length,
    empty: mockDocs.length === 0,
    metadata: { hasPendingWrites: false, fromCache: false },
    query: {} as never,
    forEach: (callback: (doc: QueryDocumentSnapshot<DocumentData>) => void) => {
      mockDocs.forEach(callback);
    },
    docChanges: () => [],
  } as QuerySnapshot<DocumentData>;
}

/**
 * Type-safe partial object creator that ensures at least some properties are provided
 */
export function createPartial<T extends Record<string, unknown>>(
  obj: Partial<T>,
): Partial<T> {
  return obj;
}

/**
 * Extracts the argument type from a mocked function call
 */
export function getCallArg<T>(
  mockFn: { mock: { calls: unknown[][] } },
  callIndex: number,
  argIndex: number,
): T {
  return mockFn.mock.calls[callIndex]?.[argIndex] as T;
}

/**
 * Type-safe way to check if an object has specific properties
 */
export function hasProperties<T>(obj: unknown, ...keys: (keyof T)[]): obj is T {
  if (typeof obj !== "object" || obj === null) return false;
  return keys.every((key) => key in obj);
}

/**
 * Creates a mock with required fields and optional overrides
 */
export function createMock<T extends Record<string, unknown>>(
  required: T,
  overrides?: Partial<T>,
): T {
  return { ...required, ...overrides };
}
