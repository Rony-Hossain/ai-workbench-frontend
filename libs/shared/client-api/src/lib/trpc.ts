import { createTRPCReact } from '@trpc/react-query';
// We need the AppRouter type. 
// Ideally, the Router type should be in a shared lib too, but for now, 
// we will use a loose type to avoid circular deps until we refactor the server side.
import { type AnyRouter } from '@trpc/server';

// We will cast this later, or we move AppRouter to 'bounded-contexts' later.
// For now, this generic setup is safe for the client lib.
export const trpc = createTRPCReact<any>();