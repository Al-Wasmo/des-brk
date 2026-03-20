import subprocess
import os


prompt = "hello, whats on /app dir?"
with open("prompt.md","r") as f:
    prompt = f.read()


pwd = os.getcwd()

docker_command = [
    "docker", "run", 
    "--rm", 
    "-v", f"{pwd}/files:/app", 
    "gemini-cli:latest", 
    "gemini",
     "--debug", 
     "--yolo", 
    "--prompt", f"""
i want you to extract the colors and the feel and the design of the site, and give a details document descriping the design for a coding llm/agent that can use your guild document in the dev of a site
and write output doc the /app dir
here are the steps to follow 
{prompt}
"""
]

try:
    result = subprocess.run(docker_command, capture_output=True, text=True, check=True)
    print("Command Output:")
    print(result.stdout)
except subprocess.CalledProcessError as e:
    print(f"Error occurred: {e}")
    print(f"stderr: {e.stderr}")