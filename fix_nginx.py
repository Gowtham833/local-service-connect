import re

def fix_nginx():
    try:
        with open('/etc/nginx/nginx.conf', 'r') as f:
            content = f.read()
        
        # Remove the default server block listening on 80
        # It typically starts with 'server {' and ends with '}'
        # We'll use a more targeted approach if possible, or just replace the known default block.
        # Let's find the block starting with "    server {" that contains "listen       80;"
        
        # A simpler way: just comment out the "listen 80;" and "root /usr/share/nginx/html;" lines 
        # in the main nginx.conf so it doesn't conflict.
        
        new_content = content.replace('listen       80;', '#listen       80;')
        new_content = new_content.replace('listen       [::]:80;', '#listen       [::]:80;')
        new_content = new_content.replace('root         /usr/share/nginx/html;', '#root         /usr/share/nginx/html;')
        new_content = new_content.replace('server_name  _;', '#server_name  _;')

        with open('/etc/nginx/nginx.conf', 'w') as f:
            f.write(new_content)
            
        print("Successfully updated nginx.conf")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    fix_nginx()
