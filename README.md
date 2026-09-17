# 🛡️ LinuxFirewall — Linux Networking & Firewall Study Portal

An interactive, browser-based learning platform for mastering **Linux network configuration and firewall administration** — built with plain HTML, CSS, and JavaScript. No backend, no database, no setup required.

<p>
  <img alt="HTML5" src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white">
  <img alt="CSS3" src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green.svg">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-brightgreen">
</p>

---

## 📖 About the Project

**LinuxFirewall** is a self-contained study portal for anyone learning Linux system administration, networking, or cybersecurity. It combines structured lessons, hands-on lab exercises, and quizzes with a set of **interactive, simulated lab tools** — letting you visualize packet flows, generate firewall rules, and practice commands safely, right in the browser.

- 📚 **7 learning modules** — from beginner network setup to advanced hardening
- 🧪 **35+ lab tasks** to reinforce every topic
- 💻 **70+ real Linux commands** explained in context
- ❓ **35 quiz questions** to test your understanding
- 🧰 **10 interactive lab tools** — no VM or root access needed

---

## ✨ Features

- **Structured curriculum** — sequential modules covering the full networking & firewall stack
- **Hands-on labs** — a guided lab exercise at the end of every module
- **Knowledge checks** — a short quiz per module
- **Interactive Laboratory** — a suite of simulated tools for visual, risk-free practice
- **Fully static** — runs entirely client-side; host it anywhere (GitHub Pages, Netlify, or just open the file)
- **Responsive dark-themed UI** — built with a custom CSS design system and animated canvas background

---

## 🗂️ Learning Modules

| # | Module | Difficulty | Key Topics |
|---|--------|------------|-------------|
| 01 | Network Configuration | 🟢 Beginner | `ip`, `nmcli`, `nmtui`, DNS, routing, DHCP |
| 02 | iptables & nftables | 🟡 Intermediate | `iptables`, `nft`, chains, tables, NAT |
| 03 | firewalld | 🟡 Intermediate | `firewall-cmd`, zones, services, rich rules |
| 04 | UFW (Uncomplicated Firewall) | 🟢 Beginner | `ufw`, application profiles, logging |
| 05 | Network Monitoring & Troubleshooting | 🟡 Intermediate | `ss`, `tcpdump`, `nmap`, Wireshark |
| 06 | VPN & Tunneling | 🔴 Advanced | WireGuard, OpenVPN, SSH tunnels, GRE |
| 07 | Network Security Hardening | 🔴 Advanced | fail2ban, SSH hardening, sysctl, SELinux |

---

## 🧰 Interactive Laboratory Tools

| Tool | Description |
|------|-------------|
| 📈 Live Telemetry | Simulated real-time RX/TX bandwidth graph and active listening sockets |
| 🔄 Netfilter Packet Flow | Animated walkthrough of packet traversal through PREROUTING → INPUT/FORWARD → POSTROUTING |
| ⚔️ Threat & Defense Simulator | Demonstrates common attacks and how firewall rules respond |
| 🛡️ Firewall Rule Generator | Builds equivalent `iptables` / `firewalld` / `ufw` rules from one input set |
| 💻 Linux Terminal Simulator | Sandboxed CLI to safely practice networking & firewall commands |
| 🔑 WireGuard VPN Generator | Generates sample WireGuard key pairs and config files |
| 🔢 Subnet & CIDR Calculator | Computes network/broadcast address, host range, and subnet mask |
| 🌐 DNS Benchmark | Compares response times across public DNS resolvers |
| 📡 My Network | Shows your live public IP and basic connection details |
| 📋 Ports Matrix | Quick-reference table of common service ports |

---

## 🏗️ Project Structure

```
Networking-Linux/
├── index.html              # Homepage — hero, module grid, interactive lab tools
├── pages/
│   ├── network-config.html # Module 01
│   ├── iptables.html       # Module 02
│   ├── firewalld.html      # Module 03
│   ├── ufw.html            # Module 04
│   ├── monitoring.html     # Module 05
│   ├── vpn.html            # Module 06
│   └── hardening.html      # Module 07
├── scripts/
│   └── app.js               # Site interactivity & tool simulations
├── styles/
│   └── main.css              # Design system, layout, and theming
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 |
| Styling | CSS3 (custom properties, Flexbox/Grid, responsive design) |
| Interactivity | Vanilla JavaScript (no frameworks) |
| Fonts | [Inter](https://fonts.google.com/specimen/Inter) & [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) via Google Fonts |
| Visualization | HTML5 Canvas (particle background & live bandwidth graph) |

---

## 🚀 Getting Started

No build tools or dependencies required.

### Option 1 — Open directly
```bash
git clone https://github.com/Gameover007coder/Networking-Linux.git
cd Networking-Linux
```
Then simply open `index.html` in your browser.

### Option 2 — Run a local server (recommended)
```bash
# Using Python
python3 -m http.server 8000

# Or using Node.js
npx serve .
```
Visit `http://localhost:8000` in your browser.

### Option 3 — Deploy with GitHub Pages
1. Go to your repository **Settings → Pages**
2. Set the source branch to `main` and folder to `/ (root)`
3. Your site will be live at `https://gameover007coder.github.io/Networking-Linux/`

---

## 📌 Usage

1. Start from the **Home** page to see an overview of all modules.
2. Work through modules sequentially, or jump directly to a topic you need.
3. Complete the **Lab Exercise** at the end of each module.
4. Test yourself with the module **Quiz**.
5. Visit the **Interactive Laboratory** section to experiment with the simulated tools.

> ⚠️ **Note:** All telemetry, packet flows, and terminal output in the interactive tools are simulated for learning purposes. This project does not connect to, scan, or modify any real network or system.

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Feel free to open an issue for bugs, suggestions, or new module ideas.

---

## 🗺️ Roadmap

- [ ] Persist quiz scores and module progress
- [ ] Add a real sandboxed Linux container for live command execution
- [ ] Cover IPv6 firewalling and cloud security groups
- [ ] Add container network policies (Docker/Kubernetes)
- [ ] Downloadable command cheat-sheets per module

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Gameover007coder**
GitHub: [@Gameover007coder](https://github.com/Gameover007coder)

---

⭐ If you find this project helpful, consider giving it a star on GitHub!
