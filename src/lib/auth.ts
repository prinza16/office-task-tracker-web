import Cookies from 'js-cookie';

export function getCurrentUser() {
  const role = Cookies.get('user_role');
  const token = Cookies.get('access_token');
  const id = Cookies.get('user_id');
  const email = Cookies.get('user_email');
  const fullName = Cookies.get('user_full_name');
  const teamId = Cookies.get('user_team_id') || null; 
  if (!token) return null;
  return { role, token, id, email, fullName, teamId };
}

export function logout() {
  Cookies.remove('access_token');
  Cookies.remove('user_role');
  Cookies.remove('user_id');
  Cookies.remove('user_email');
  Cookies.remove('user_full_name');
  Cookies.remove('user_team_id'); 
  window.location.href = '/login';
}