/* pg_net is not relocatable; recreate it in the extensions schema. Its functions stay in schema `net`. */
drop extension if exists pg_net;
create extension pg_net with schema extensions;
