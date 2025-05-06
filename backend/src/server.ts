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
  //const isPasswordValid = await comparePassword(password, user.password_hash);

  // if (!isPasswordValid) {
  //   return reply.code(401).send({ 
  //     success: false, 
  //     message: 'Invalid username or password' 
  //   });
  // }

  //TODO: Generate auth token with user ID


  // Return success with token and user ID
  return reply.send({
    success: true,
    userId: user.id
  }); // TODO: Add token to return
});

fastify.post('/api/register', async (req, reply) => {
  const { username, email, password, displayName } = req.body as { username: string; email: string; password: string; displayName: string };

  // hash password, validate, etc...
  const userId = await createUser({
    username,
    email,
    passwordHash: password, // TODO: Replace with actual hash
    displayName,
  });

  //TODO: JWT with user ID?

  reply.send({ success: true, userId }); // ADD token to return
});

fastify.get('/api/user', async (req, reply) => {
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