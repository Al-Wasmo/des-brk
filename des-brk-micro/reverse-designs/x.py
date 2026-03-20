import subprocess
import os


prompt = "hello, whats on /app dir?"
with open("prompt.md","r") as f:
    prompt = f.read()


pwd = os.getcwd()

docker_command = [
 f"""
i want you to extract the colors and the feel and the design of the site, and give a details document descriping the design for a coding llm/agent that can use your guild document in the dev of a site
and write output doc the /app dir
here are the steps to follow 
{prompt}
"""
]
print(docker_command)