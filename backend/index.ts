import Fastify from 'fastify';

const server = Fastify();

server.get('/api/hello', async (req, res) => {
  return { msg: 'Hello World from Backend!' };
});

server.listen({ port: 4000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 Backend running at ${address}`);
});
