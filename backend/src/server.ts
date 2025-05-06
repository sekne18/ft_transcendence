import Fastify from 'fastify'
import { createUser, getUserByEmail, getUserById, getUserByUsername, getUserProfileById, updateUser } from './db/queries/user.js'
import { initializeDatabase } from './db/schema.js'
import { getStatsByUserId } from './db/queries/stats.js'
const fastify = Fastify({
  logger: true
})

// Declare a route
fastify.get('/', async function handler(request, reply) {
  return { hello: 'world' }
})

fastify.get('/api', async function handler(request, reply) {
  return { ping: 'pong' }
})

fastify.post('/api/login', async (req, reply) => {
  const { email, password } = req.body as {
    email: string;
    password: string;
  };

  // Find user by username
  const user = await getUserByEmail(email) as { id: number; email: string; password: string };
  if (!user) {
    return reply.code(401).send({
      success: false,
      message: 'Invalid username or password'
    });
  }

  //TODO: Compare password hash
  //const isPasswordValid = await comparePassword(password, user.password); // Example function
  const isPasswordValid = password === user.password; // TODO: Replace with actual hash comparison

  if (!isPasswordValid) {
    return reply.code(401).send({ 
      success: false, 
      message: 'Invalid username or password' 
    });
  }

  //TODO: Generate auth token with user ID
  return reply.send({
    success: true,
    id: user.id
  }); // TODO: Add token to return
});

fastify.post('/api/register', async (req, reply) => {
  const { username, email, password, repassword } = req.body as { username: string; email: string; password: string; repassword: string };

  console.log('Password: ', password);
  if (password !== repassword) {
    return reply.code(400).send({
      success: false,
      message: 'Passwords do not match'
    });
  }
    // hash password, validate, etc...
  const userId = await createUser({
    username,
    email,
    password, // TODO: Replace with actual hash
    avatarUrl: 'https://campus19.be/wp-content/uploads/2025/02/19_member42_blanc.png' // TODO: Replace with actual avatar URL
  });

  if (!userId) {
    return reply.code(400).send({
      success: false,
      message: 'User already exists'
    });
  }

  //TODO: JWT with user ID?
  return reply.send({ success: true, id: userId }); // ADD token to return
});

fastify.post('/api/user/update', async (req, reply) => {
  const { id, username, password, avatarUrl } = req.body as {
    id: number;
    username: string;
    password: string;
    avatarUrl: string;
  };

  if (!id || !username || !password || !avatarUrl) {
    return reply.code(400).send({
      success: false,
      message: 'Missing fields'
    });
  }

  updateUser(id, { username, password, avatarUrl });
  
  return reply.send({ success: true }); 
});

fastify.get('/api/user/:id', async (req, reply) => {
  const { id } = req.params as { id: string };

  // Validate and convert to number
  if (!id || isNaN(Number(id))) {
    return reply.code(400).send({
      success: false,
      message: 'Invalid user ID'
    });
  }

  const user = await getUserById(Number(id));

  // Handle case where user isn't found
  if (!user) {
    return reply.code(404).send({
      success: false,
      message: 'User not found'
    });
  }

  return reply.send({ success: true, user });
});

fastify.get('/api/user/profile/:id', async (req, reply) => {
  const { id } = req.params as { id: string };

  if (!id || isNaN(Number(id))) {
    return reply.code(400).send({ success: false, message: 'Invalid user ID' });
  }

  const user = getUserProfileById(Number(id));

  if (!user) {
    return reply.code(404).send({ success: false, message: 'User not found' });
  }

  return reply.send({ success: true, user });
});

fastify.get('/api/user/:id/stats', async (req, reply) => {
  const { id } = req.params as { id: string };

  // Validate and convert to number
  if (!id || isNaN(Number(id))) {
    return reply.code(400).send({
      success: false,
      message: 'Invalid user ID'
    });
  }

  const stats = await getStatsByUserId(Number(id));

  // Handle case where user isn't found
  if (!stats) {
    return reply.code(404).send({
      success: false,
      message: 'Stats not found'
    });
  }

  return reply.send({ success: true, stats });
});

// Run the server!
try {
  initializeDatabase();
  await fastify.listen({ port: 3000 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}