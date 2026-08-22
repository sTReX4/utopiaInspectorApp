import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Account {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleInitial: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
}

const ACCOUNT_KEY = '@utopia/account';
const SESSION_KEY = '@utopia/session';

export async function getAccount(): Promise<Account | null> {
  const stored = await AsyncStorage.getItem(ACCOUNT_KEY);
  return stored ? (JSON.parse(stored) as Account) : null;
}

export async function saveAccount(account: Account): Promise<void> {
  await AsyncStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
}

export async function signInAccount(email: string, password: string): Promise<boolean> {
  const account = await getAccount();
  const isValid = account?.email.toLowerCase() === email.trim().toLowerCase() && account.password === password;

  if (isValid) {
    await AsyncStorage.setItem(SESSION_KEY, 'signed-in');
  }

  return Boolean(isValid);
}

export async function startSession(): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, 'signed-in');
}

export async function signOutAccount(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function updateAccount(changes: Partial<Account>): Promise<Account | null> {
  const account = await getAccount();
  if (!account) return null;

  const updatedAccount = { ...account, ...changes };
  await saveAccount(updatedAccount);
  return updatedAccount;
}
