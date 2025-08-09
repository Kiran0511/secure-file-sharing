openssl rsa -in sender_private.pem -pubout -out recipient_public.pem
openssl genrsa -out sender_private.pem 2048
