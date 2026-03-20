FROM node:20-slim

# Set the working directory
WORKDIR /app

# Install Python, required dependencies, and python3-venv
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    python3-venv \
    build-essential \
    libssl-dev \
    libffi-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libopenjp2-7-dev \
    liblcms2-dev \
    libblas-dev \
    liblapack-dev \
    gfortran \
    imagemagick \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment for Python and install packages
RUN python3 -m venv /venv
RUN /venv/bin/pip install --upgrade pip

# Install OpenCV and image processing libraries in the virtual environment
RUN /venv/bin/pip install opencv-python-headless \
    opencv-contrib-python-headless \
    numpy \
    pillow \
    scikit-image \
    scikit-learn \
    matplotlib \
    pandas

# Install Node.js dependencies
RUN npm install -g @google/gemini-cli

# Set the Gemini API key (you can replace this as needed)
ENV GEMINI_API_KEY=""

# Set the virtual environment to be used
ENV PATH="/venv/bin:$PATH"

# Command to run when the container starts
CMD ["gemini"]FROM node:20-slim

# Set the working directory
WORKDIR /app

# Install Python, required dependencies, and python3-venv
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    python3-venv \
    build-essential \
    libssl-dev \
    libffi-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libopenjp2-7-dev \
    liblcms2-dev \
    libblas-dev \
    liblapack-dev \
    gfortran \
    imagemagick \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment for Python and install packages
RUN python3 -m venv /venv
RUN /venv/bin/pip install --upgrade pip

# Install OpenCV and image processing libraries in the virtual environment
RUN /venv/bin/pip install opencv-python-headless \
    opencv-contrib-python-headless \
    numpy \
    pillow \
    scikit-image \
    scikit-learn \
    matplotlib \
    pandas

# Install Node.js dependencies
RUN npm install -g @google/gemini-cli

# Set the Gemini API key (you can replace this as needed)
ENV GEMINI_API_KEY="ADD YOUR OWN KEY"

# Set the virtual environment to be used
ENV PATH="/venv/bin:$PATH"

# Command to run when the container starts
CMD ["gemini"]