This project is our group work for 104 UX Principles II. We designed and built a mobile-friendly web application that connects to the Clash Royale API. 
The idea was to let users view real-time player profiles, check recent matches, and search or compare clans. These purposes were set out clearly in our group document and guided how we developed both the designs and the codeWhen we first tried to connect our frontend to the Clash Royale API directly, we quickly ran into problems. The main issues were:

#CORS restrictions – the browser blocked our requests because the Clash Royale API doesn’t allow cross-origin calls.
#API key exposure – putting the token in our client-side JavaScript meant anyone could see it and copy it.
#Changing IP addresses??? the API requires us to whitelist a single IP address, but would not work when using different systems. 

To get around these problems we experimented with different hosting setups. We tried to run a Node.js backend on Fly.io and also looked at Railway. Both seemed like possible solutions because they allowed environment variables to hide the key, but in practice they caused more problems. Fly.io required us to deal with static IPs, SSL certificates and port settings, which made deployment messy. Railway was similar in that it worked in theory but not reliably for our school environment. These attempts are still in our GitHub history to show the work we did, even though they were not the right approach in the end.

The turning point was finding out about the RoyaleAPI Proxy. This is a free service that sits between our code and the official Clash Royale API. Instead of Supercell onlu letting one IP acess (making it bad for working at home and for our tutor) they only ever see the proxy’s single static IP address (45.79.218.79). We just whitelist that once when creating our key. From there we replace the normal base URL.

===========
Our solution was to create a small serverless backend, deployed on Vercel. This backend only has one job: to forward requests from our frontend to the RoyaleAPI proxy while adding the API key from an environment variable. This way:

##the token is never visible in client-side code,

the browser does not hit CORS errors,

and the app works on any network



--------------- ARCHIVE
Aborted below: Using a Proxy Now.
# Clash Hub API Proxy

A simple Express server that proxies requests to the Clash Royale API using a secure `.env` key.
Use this to bypass IP whitelisting issues when developing frontend apps on school or public networks.

