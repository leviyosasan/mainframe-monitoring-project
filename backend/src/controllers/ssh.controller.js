const { Client } = require('ssh2');

let sshClient = null;

const connectSSH = async (req, res) => {
  try {
    const { host, port, username, password } = req.body;
    
    if (!host || !username) {
      return res.status(400).json({
        success: false,
        message: 'Host and username are required'
      });
    }

    // Close existing connection if any
    if (sshClient) {
      sshClient.end();
    }

    // Create new SSH client
    sshClient = new Client();
    
    sshClient.on('ready', () => {
      console.log('SSH connection established');
      res.status(200).json({
        success: true,
        message: `Connected to ${host} as ${username}`,
        connectionInfo: {
          host,
          port: port || 22,
          username
        }
      });
    });

    sshClient.on('error', (err) => {
      console.error('SSH connection error:', err);
      res.status(500).json({
        success: false,
        message: 'SSH connection failed',
        error: err.message
      });
    });

    // Connect to SSH server
    sshClient.connect({
      host,
      port: parseInt(port) || 22,
      username,
      password
    });

  } catch (error) {
    console.error('SSH controller error:', error);
    res.status(500).json({
      success: false,
      message: 'SSH connection failed',
      error: error.message
    });
  }
};

const executeCommand = async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!sshClient) {
      return res.status(400).json({
        success: false,
        message: 'No SSH connection established'
      });
    }

    if (!command) {
      return res.status(400).json({
        success: false,
        message: 'Command is required'
      });
    }

    sshClient.exec(command, (err, stream) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Command execution failed',
          error: err.message
        });
      }

      let output = '';
      let errorOutput = '';

      stream.on('close', (code, signal) => {
        res.status(200).json({
          success: true,
          output: output,
          error: errorOutput,
          exitCode: code
        });
      });

      stream.on('data', (data) => {
        output += data.toString();
      });

      stream.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
    });

  } catch (error) {
    console.error('SSH command execution error:', error);
    res.status(500).json({
      success: false,
      message: 'Command execution failed',
      error: error.message
    });
  }
};

const disconnectSSH = async (req, res) => {
  try {
    if (sshClient) {
      sshClient.end();
      sshClient = null;
      res.status(200).json({
        success: true,
        message: 'SSH connection closed'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'No SSH connection to close'
      });
    }
  } catch (error) {
    console.error('SSH disconnect error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect SSH',
      error: error.message
    });
  }
};

module.exports = {
  connectSSH,
  executeCommand,
  disconnectSSH
};
