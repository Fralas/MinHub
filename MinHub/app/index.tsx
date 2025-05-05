import { Redirect } from 'expo-router';

export default function Index() {
  // Reindirizza automaticamente alla schermata "/home"
  // Assicurati di avere un file app/home.tsx (o .js) per questa rotta.
  return <Redirect href="/home" />;
}