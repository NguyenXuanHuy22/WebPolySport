export const loginAPI = async ({ email, password }) => {
  console.log('📤 Sending login request to backend...');
  const res = await fetch('http://localhost:5000/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  console.log('📥 Response status:', res.status);

  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ Error response (raw text):', errorText);
    throw new Error('Sai email hoặc mật khẩu');
  }

  return await res.json(); // Trả về user object (phải có `role`)
};
