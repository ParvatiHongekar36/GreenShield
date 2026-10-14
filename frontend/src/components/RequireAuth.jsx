import { Navigate } from 'react-router-dom';

// Shows the page only if the user has logged in. Otherwise goes to /login.
export default function RequireAuth({ children }) {
  const user = localStorage.getItem('greenshieldUser');
  return user ? children : <Navigate to="/login" replace />;
}