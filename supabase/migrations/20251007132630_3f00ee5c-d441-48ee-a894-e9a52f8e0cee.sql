-- Create enum for user types
CREATE TYPE user_type AS ENUM ('farmer', 'customer');

-- Create enum for product categories
CREATE TYPE product_category AS ENUM ('fruit', 'vegetable');

-- Create enum for order status
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'completed', 'cancelled');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type user_type NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category product_category NOT NULL,
  image_url TEXT NOT NULL,
  qualities JSONB NOT NULL DEFAULT '[]'::jsonb,
  prices JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cart_items table
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  selected_quality TEXT NOT NULL,
  selected_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  total_amount NUMERIC NOT NULL,
  status order_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  quality TEXT NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Products policies
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Farmers can insert own products"
  ON public.products FOR INSERT
  WITH CHECK (
    auth.uid() = farmer_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'farmer')
  );

CREATE POLICY "Farmers can update own products"
  ON public.products FOR UPDATE
  USING (
    auth.uid() = farmer_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'farmer')
  );

CREATE POLICY "Farmers can delete own products"
  ON public.products FOR DELETE
  USING (
    auth.uid() = farmer_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'farmer')
  );

-- Cart items policies
CREATE POLICY "Customers can view own cart"
  ON public.cart_items FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers can insert to own cart"
  ON public.cart_items FOR INSERT
  WITH CHECK (
    auth.uid() = customer_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'customer')
  );

CREATE POLICY "Customers can update own cart"
  ON public.cart_items FOR UPDATE
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers can delete from own cart"
  ON public.cart_items FOR DELETE
  USING (auth.uid() = customer_id);

-- Orders policies
CREATE POLICY "Customers can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = customer_id OR auth.uid() = farmer_id);

CREATE POLICY "Customers can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = customer_id OR auth.uid() = farmer_id);

-- Order items policies
CREATE POLICY "Users can view order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_items.order_id 
      AND (customer_id = auth.uid() OR farmer_id = auth.uid())
    )
  );

CREATE POLICY "Customers can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_items.order_id 
      AND customer_id = auth.uid()
    )
  );

-- Function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_type, full_name)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'user_type')::user_type,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();