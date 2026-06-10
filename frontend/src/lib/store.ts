import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string; // The giveaway slug or ID
    title: string;
    price: number;
    quantity: number;
    image?: string;
    minTickets?: number; // Permite respectarea regulii minime în coș
    quizAnswer?: number; // Selectat la QuizGate
}

interface CartState {
    items: CartItem[];
    isCartOpen: boolean;
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    toggleCart: () => void;
    setCartOpen: (isOpen: boolean) => void;
    getTotal: () => number;
    getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isCartOpen: false,

            addItem: (newItem) => {
                // Tracking-ul AddToCart (Pixel + CAPI) se face din QuizGate.tsx
                // înainte de apelul addItem(), cu Event ID comun pentru dedublare.
                // Nu duplicăm aici pentru a evita trimiterea dublă a evenimentului.

                set((state) => {
                    const existingItem = state.items.find((item) => item.id === newItem.id);
                    if (existingItem) {
                        return {
                            items: state.items.map((item) =>
                                item.id === newItem.id
                                    ? { ...item, quantity: item.quantity + newItem.quantity }
                                    : item
                            ),
                            isCartOpen: true, // open cart automatically when adding
                        };
                    }
                    return { items: [...state.items, newItem], isCartOpen: true };
                });
            },

            removeItem: (id) => {
                set((state) => ({
                    items: state.items.filter((item) => item.id !== id),
                }));
            },

            updateQuantity: (id, quantity) => {
                set((state) => {
                    const item = state.items.find((i) => i.id === id);
                    if (item && item.price === 0 && quantity > 1) {
                        return state; // Nu facem nicio schimbare
                    }
                    
                    const minAllowed = item?.minTickets !== undefined ? item.minTickets : 1;
                    
                    // Tratăm separat cazul de ștergere totală (quantity 0)
                    if (quantity <= 0) {
                        return { items: state.items.filter((item) => item.id !== id) };
                    }
                    
                    // Protecție: nu permite scăderea sub valoarea minimă a concursului
                    if (quantity < minAllowed) {
                        return state; // Blocat - ignorăm decrementul
                    }

                    return {
                        items: state.items.map((item) =>
                            item.id === id ? { ...item, quantity } : item
                        ),
                    };
                });
            },

            clearCart: () => set({ items: [] }),

            toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

            setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),

            getTotal: () => {
                const { items } = get();
                return items.reduce((total, item) => total + item.price * item.quantity, 0);
            },

            getItemCount: () => {
                const { items } = get();
                return items.reduce((count, item) => count + item.quantity, 0);
            },
        }),
        {
            name: 'gp-competition-cart', // Unique name for localStorage
            partialize: (state) => ({ items: state.items }), // Only persist items, not UI state (isCartOpen)
        }
    )
);
