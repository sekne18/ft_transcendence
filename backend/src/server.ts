import Fastify from 'fastify'
import { createUser, getUserByEmail, getUserById, getUserByUsername } from './db/queries/user.js'
import { initializeDatabase } from './db/schema.js'
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
    userId: user.id
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
    avatarUrl: '' // TODO: Replace with actual avatar URL
  });

  if (!userId) {
    return reply.code(400).send({
      success: false,
      message: 'User already exists'
    });
  }

  //TODO: JWT with user ID?
  return reply.send({ success: true, userId }); // ADD token to return
});

fastify.get('/api/user/:id', async (req, reply) => {
  const { id } = req.query as { id: string };

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

  reply.send(user);
});


// Run the server!
try {
  initializeDatabase();
  await fastify.listen({ port: 3000 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}