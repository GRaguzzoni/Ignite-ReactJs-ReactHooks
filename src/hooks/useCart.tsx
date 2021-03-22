import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { setTokenSourceMapRange } from 'typescript';
import { ProductList } from '../pages/Home/styles';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
  const storagedCart = localStorage.getItem('@RocketShoes:cart');

  if (storagedCart) {
     return JSON.parse(storagedCart);
  }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const {data: stock} = await api.get(`/stock/${productId}`);
      
      let cartNewAmount = [...cart];
      const productAlreadyInCart =  cart.find(product => product.id === productId);
      
      if (productAlreadyInCart) {
        const productAvaiableInStock = stock.amount > productAlreadyInCart.amount;
        console.log(productAlreadyInCart.amount);
        if(!productAvaiableInStock) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        const updateCartAmount = cart.map(product => {
          return product.id === productId
          ? {...product, amount: productAlreadyInCart.amount + 1}
          : product;
        })

        localStorage.setItem('@RocketShoes:cart',JSON.stringify(updateCartAmount));
        setCart(updateCartAmount);
        
      } else {  

          const productResponse = await api.get(`/products/${productId}`);
          cartNewAmount = [
            ...cart, {
              ...productResponse.data,
              amount: 1
            },
          ];

        localStorage.setItem('@RocketShoes:cart',JSON.stringify(cartNewAmount));
        setCart(cartNewAmount);          
      }
        
         
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId);
        if (!productExists) {
          toast.error("Erro na remoção do produto");
          return;
        }

      const cartFiltered = cart.filter(product => product.id !== productId);
      localStorage.setItem('@RocketShoes:cart',JSON.stringify(cartFiltered));
      setCart(cartFiltered);

    } catch {
     toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;

      const {data: stock} = await api.get(`/stock/${productId}`);
      const productExistInCart = cart.find(product => product.id === productId);

      if (!productExistInCart){
        throw Error();
      }

      const productInStock = stock.amount >= amount;

      if (!productInStock){
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const updateCartAmount = cart.map(product => {
        return product.id === productId
        ? {...product, amount} : product;
      })

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCartAmount));
      setCart(updateCartAmount);
        
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
