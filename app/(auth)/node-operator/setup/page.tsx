'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';

interface Step {
  id: number;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  { id: 1, title: 'Prerequisites', description: 'Check your server meets requirements' },
  { id: 2, title: 'Get Testnet ETH', description: 'Fund your wallet on Arbitrum Sepolia' },
  { id: 3, title: 'Download Node', description: 'Install the OARN node binary' },
  { id: 4, title: 'Configure', description: 'Create your node config file' },
  { id: 5, title: 'Start & Verify', description: 'Launch and confirm your node is live' },
];

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group mt-3">
      <pre className="bg-background text-text text-sm rounded-lg p-4 overflow-x-auto border border-border font-mono leading-relaxed">
        {code}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-surface border border-border text-text-muted hover:text-text transition-colors opacity-0 group-hover:opacity-100"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

function StepIndicator({ current, steps }: { current: number; steps: Step[] }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-center flex-shrink-0">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                step.id < current
                  ? 'bg-success border-success text-white'
                  : step.id === current
                  ? 'bg-primary border-primary text-white'
                  : 'bg-background border-border text-text-muted'
              }`}
            >
              {step.id < current ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.id
              )}
            </div>
            <span
              className={`text-xs mt-1 hidden sm:block max-w-[80px] text-center leading-tight ${
                step.id === current ? 'text-primary font-medium' : 'text-text-muted'
              }`}
            >
              {step.title}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`h-0.5 w-10 sm:w-16 mx-1 flex-shrink-0 transition-colors ${
                step.id < current ? 'bg-success' : 'bg-border'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Step1() {
  const reqs = [
    { label: 'OS', value: 'Linux (Ubuntu 20.04+ recommended)' },
    { label: 'CPU', value: '4+ cores (8 recommended)' },
    { label: 'RAM', value: '8 GB minimum (16 GB recommended)' },
    { label: 'Disk', value: '50 GB SSD free space' },
    { label: 'Network', value: 'Stable internet connection, 100 Mbps+' },
    { label: 'Wallet', value: 'Ethereum wallet with Arbitrum Sepolia ETH' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text mb-2">Server Requirements</h2>
        <p className="text-text-muted text-sm">
          Make sure your server meets these minimum requirements before continuing.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {reqs.map((req) => (
          <div key={req.label} className="flex gap-3 p-3 bg-background rounded-lg border border-border">
            <div className="w-5 h-5 mt-0.5 flex-shrink-0 text-success">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium uppercase tracking-wide">{req.label}</p>
              <p className="text-sm text-text">{req.value}</p>
            </div>
          </div>
        ))}
      </div>

      <Card padding="md" className="border-primary/30 bg-primary/5">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-text">Running on testnet</p>
            <p className="text-sm text-text-muted mt-1">
              OARN is currently on Arbitrum Sepolia testnet. No real funds are at risk. This is your opportunity
              to earn GOV token points that convert at mainnet TGE (Q3 2026) with an early bird 1.5× multiplier
              active until April 30.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Step2() {
  const faucets = [
    {
      name: 'Alchemy Faucet',
      description: 'Free Arbitrum Sepolia ETH, requires account',
      url: 'https://www.alchemy.com/faucets/arbitrum-sepolia',
      recommended: true,
    },
    {
      name: 'QuickNode Faucet',
      description: 'Alternative faucet, requires account',
      url: 'https://faucet.quicknode.com/arbitrum/sepolia',
      recommended: false,
    },
    {
      name: 'Chainlink Faucet',
      description: 'No account required, small amounts',
      url: 'https://faucets.chain.link/arbitrum-sepolia',
      recommended: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text mb-2">Get Arbitrum Sepolia ETH</h2>
        <p className="text-text-muted text-sm">
          Your node wallet needs ETH on Arbitrum Sepolia to register and claim tasks. You need at least 0.05 ETH.
        </p>
      </div>

      <div className="p-4 bg-background rounded-lg border border-border">
        <p className="text-xs text-text-muted font-medium uppercase tracking-wide mb-2">Network Details</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-text-muted">Network:</span> <span className="text-text">Arbitrum Sepolia</span></div>
          <div><span className="text-text-muted">Chain ID:</span> <span className="text-text font-mono">421614</span></div>
          <div><span className="text-text-muted">Symbol:</span> <span className="text-text">ETH</span></div>
          <div><span className="text-text-muted">RPC:</span> <span className="text-text font-mono text-xs">sepolia-rollup.arbitrum.io/rpc</span></div>
        </div>
      </div>

      <div className="space-y-3">
        {faucets.map((faucet) => (
          <div key={faucet.name} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text">{faucet.name}</p>
                  {faucet.recommended && (
                    <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium">Recommended</span>
                  )}
                </div>
                <p className="text-xs text-text-muted">{faucet.description}</p>
              </div>
            </div>
            <a
              href={faucet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
            >
              Open
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        ))}
      </div>

      <Card padding="md" className="border-warning/30 bg-warning/5">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-text-muted">
            <span className="text-text font-medium">Keep your private key secure.</span> Generate a dedicated wallet for your node — don&apos;t reuse your personal wallet.
          </p>
        </div>
      </Card>
    </div>
  );
}

function Step3() {
  const [method, setMethod] = useState<'docker' | 'binary' | 'source'>('docker');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text mb-2">Install the Node</h2>
        <p className="text-text-muted text-sm">
          Choose your installation method. Docker is the easiest — no dependency setup required.
        </p>
      </div>

      {/* Method selector */}
      <div className="flex gap-2 p-1 bg-background rounded-lg border border-border">
        {(['docker', 'binary', 'source'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition-colors capitalize ${
              method === m
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {m === 'docker' ? 'Docker (recommended)' : m === 'binary' ? 'Pre-built Binary' : 'Build from Source'}
          </button>
        ))}
      </div>

      {method === 'docker' && (
        <div className="space-y-4">
          <Card padding="md" className="border-primary/20 bg-primary/5">
            <p className="text-sm text-text-muted">
              <span className="text-text font-medium">Easiest option.</span> Docker handles all dependencies automatically. You only need Docker installed.
            </p>
          </Card>
          <div>
            <p className="text-sm font-medium text-text mb-2">1. Install Docker (if not already installed)</p>
            <CodeBlock code={`curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for the group change to take effect`} />
          </div>
          <div>
            <p className="text-sm font-medium text-text mb-2">2. Pull the node image</p>
            <CodeBlock code={`docker pull ghcr.io/oarn-network/oarn-node:latest`} />
          </div>
          <div>
            <p className="text-sm font-medium text-text mb-2">3. Verify it works</p>
            <CodeBlock code={`docker run --rm ghcr.io/oarn-network/oarn-node:latest --version`} />
          </div>
        </div>
      )}

      {method === 'binary' && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-text mb-2">1. Download the latest release</p>
            <CodeBlock code={`wget https://github.com/oarn-network/oarn-node/releases/latest/download/oarn-node-linux-x86_64.tar.gz
tar -xzf oarn-node-linux-x86_64.tar.gz
chmod +x oarn-node
sudo mv oarn-node /usr/local/bin/`} />
          </div>
          <div>
            <p className="text-sm font-medium text-text mb-2">2. Verify the installation</p>
            <CodeBlock code={`oarn-node --version`} />
          </div>
          <div>
            <p className="text-sm font-medium text-text mb-2">3. Create the node directory</p>
            <CodeBlock code={`sudo mkdir -p /opt/oarn/cache
sudo chown -R $USER:$USER /opt/oarn`} />
          </div>
        </div>
      )}

      {method === 'source' && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-text mb-2">1. Install Rust (1.75+)</p>
            <CodeBlock code={`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env`} />
          </div>
          <div>
            <p className="text-sm font-medium text-text mb-2">2. Clone and build</p>
            <CodeBlock code={`git clone https://github.com/oarn-network/oarn-network.git
cd oarn-network/oarn-node

# CPU-only (default)
cargo build --release --features compute

# With NVIDIA GPU support
cargo build --release --features compute,cuda

# With AMD GPU support
cargo build --release --features compute,rocm`} />
          </div>
          <div>
            <p className="text-sm font-medium text-text mb-2">3. Install the binary</p>
            <CodeBlock code={`sudo cp target/release/oarn-node /usr/local/bin/
sudo mkdir -p /opt/oarn/cache
sudo chown -R $USER:$USER /opt/oarn`} />
          </div>
        </div>
      )}
    </div>
  );
}

function Step4() {
  const configToml = `mode = "standard"

[network]
listen_addresses = ["/ip4/0.0.0.0/tcp/4001"]
max_peers = 50

[network.discovery]
method = "manual"
# Leave empty — the node finds peers via the IPFS DHT automatically.
# If you have trouble connecting, ask in Discord for a bootstrap multiaddr.
manual_bootstrap = []

[blockchain]
chain_id = 421614
rpc_discovery = "manual"
manual_rpc_url = "https://sepolia-rollup.arbitrum.io/rpc"
rpc_redundancy = 1

[blockchain.contracts]
# Official Arbitrum Sepolia testnet addresses — do not modify
task_registry_v2 = "0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0"
oarn_registry    = "0xa122518Cb6E66A804fc37EB26c8a7aF309dCF04C"
token_reward     = "0x24249A523A251E38CB0001daBd54DD44Ea8f1838"
gov_token        = "0xB97eDD49C225d2c43e7203aB9248cAbED2B268d3"

[storage]
ipfs_api    = "http://127.0.0.1:5001"
cache_dir   = "/opt/oarn/cache"
max_cache_mb = 5000

[compute]
max_ram_mb       = 8192
frameworks       = ["onnx"]
concurrent_tasks = 1

[privacy]
tor_enabled     = false
padding_enabled = false`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text mb-2">Configure Your Node</h2>
        <p className="text-text-muted text-sm">
          Set your private key as an environment variable, then create the config file.
        </p>
      </div>

      {/* Private key — env var first */}
      <div>
        <p className="text-sm font-medium text-text mb-1">1. Set your private key (never put it in a file)</p>
        <p className="text-xs text-text-muted mb-2">
          Export the variable before starting the node. For servers, add it to <code className="bg-background px-1 rounded">/etc/environment</code> or a <code className="bg-background px-1 rounded">.env</code> file that is not committed to Git.
        </p>
        <CodeBlock code={`export OARN_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE`} />
      </div>

      {/* Config file */}
      <div>
        <p className="text-sm font-medium text-text mb-1">2. Create the config file</p>
        <CodeBlock code={`nano /opt/oarn/config.toml`} />
      </div>

      <div>
        <p className="text-sm font-medium text-text mb-2">3. Paste this content (addresses are correct — do not change):</p>
        <CodeBlock code={configToml} />
      </div>

      <Card padding="md" className="border-error/30 bg-error/5">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-error flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-sm text-text-muted">
            <span className="text-error font-medium">Never put your private key in config.toml or commit it to Git.</span>{' '}
            Always use the <code className="bg-background px-1 rounded">OARN_PRIVATE_KEY</code> environment variable.
          </div>
        </div>
      </Card>
    </div>
  );
}

function Step5() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text mb-2">Start Your Node</h2>
        <p className="text-text-muted text-sm">
          Launch your node and confirm it is connected and polling for tasks.
        </p>
      </div>

      <div className="space-y-5">
        {/* Docker */}
        <div>
          <p className="text-sm font-medium text-text mb-2">If you installed via Docker</p>
          <CodeBlock code={`docker run -d \\
  --name oarn-node \\
  --restart unless-stopped \\
  -e OARN_PRIVATE_KEY=0xYOUR_PRIVATE_KEY \\
  -v /opt/oarn/config.toml:/config/config.toml:ro \\
  -v /opt/oarn/cache:/data/cache \\
  ghcr.io/oarn-network/oarn-node:latest

# Follow logs
docker logs -f oarn-node`} />
        </div>

        {/* Binary / source */}
        <div>
          <p className="text-sm font-medium text-text mb-2">If you installed the binary or built from source</p>
          <CodeBlock code={`# Make sure OARN_PRIVATE_KEY is exported first (see Step 4)

# Option A — foreground (useful for first-run testing)
oarn-node --config /opt/oarn/config.toml start

# Option B — background with PM2 (recommended for servers)
npm install -g pm2
pm2 start oarn-node \\
  --name oarn-node \\
  --interpreter none \\
  -- --config /opt/oarn/config.toml start
pm2 save && pm2 startup`} />
        </div>

        <div>
          <p className="text-sm font-medium text-text mb-2">Check logs</p>
          <CodeBlock code={`pm2 logs oarn-node       # if using PM2
docker logs -f oarn-node # if using Docker`} />
        </div>
      </div>

      <div className="p-4 bg-background rounded-lg border border-border">
        <p className="text-sm font-medium text-text mb-3">Healthy startup looks like this:</p>
        <pre className="text-xs text-success font-mono leading-relaxed whitespace-pre-wrap">
{`[INFO] OARN Node v0.x.x starting...
[INFO] Wallet: 0xYOUR_ADDRESS
[INFO] Connected to Arbitrum Sepolia (chain 421614)
[INFO] TaskRegistryV2 at 0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0
[INFO] Polling for available V2 tasks (consensus)...
[INFO] Total task count on TaskRegistryV2: 5
[INFO] Task #5 is available!
[INFO] Claiming task #5 on TaskRegistryV2...
[INFO] Task #5 claimed. Downloading model from IPFS...
[INFO] Running inference...
[INFO] Submitting result hash 0xabc...`}
        </pre>
      </div>

      <div className="p-4 bg-background rounded-lg border border-border space-y-3">
        <p className="text-sm font-medium text-text">Common first-run messages (not errors)</p>
        <div className="space-y-2 text-xs font-mono">
          <div>
            <span className="text-warning">Found 0 closest peers</span>
            <span className="text-text-muted ml-2">— normal until another node is running; does not block task processing</span>
          </div>
          <div>
            <span className="text-text-muted">No available V2 tasks</span>
            <span className="text-text-muted ml-2">— all current tasks are expired or completed; submit a new one from the dashboard</span>
          </div>
        </div>
      </div>

      <Card padding="md" className="border-success/30 bg-success/5">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-text-muted">
            <span className="text-success font-medium">You&apos;re live!</span> Your node will automatically claim tasks, compute results, reach consensus with other nodes, and earn ETH + GOV points. Check the{' '}
            <a href="/node-operator" className="text-primary hover:underline">dashboard</a> to track your earnings and reputation.
          </div>
        </div>
      </Card>

      <div className="pt-4 border-t border-border">
        <p className="text-sm font-medium text-text mb-3">Need help?</p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://github.com/oarn-network/oarn-node/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Open an Issue
          </a>
          <a
            href="https://github.com/oarn-network"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            GitHub Org
          </a>
        </div>
      </div>
    </div>
  );
}

const STEP_COMPONENTS = [Step1, Step2, Step3, Step4, Step5];

export default function NodeSetupPage() {
  const [currentStep, setCurrentStep] = useState(1);

  const StepComponent = STEP_COMPONENTS[currentStep - 1];
  const isFirst = currentStep === 1;
  const isLast = currentStep === STEPS.length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Node Setup Guide</h1>
        <p className="text-text-muted mt-1">
          Follow these steps to get your OARN node running and start earning.
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator current={currentStep} steps={STEPS} />

      {/* Step Content */}
      <Card padding="lg">
        <StepComponent />

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button
            variant="secondary"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={isFirst}
          >
            ← Previous
          </Button>

          <span className="text-sm text-text-muted">
            Step {currentStep} of {STEPS.length}
          </span>

          {isLast ? (
            <a href="/node-operator">
              <Button>Go to Dashboard →</Button>
            </a>
          ) : (
            <Button onClick={() => setCurrentStep((s) => s + 1)}>
              Next →
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
