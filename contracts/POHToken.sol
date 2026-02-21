// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title POHToken — Pursuit of Happiness Coin
 * @notice ERC20 charity token on Base with Voyager 1 tokenomics.
 *
 * Tokenomics:
 *   Max supply:    24,526,000,000 (Voyager 1 distance in km, snapshot at launch)
 *   Buy fee:       1%   (0.5% charity, 0.5% liquidity)
 *   Sell fee:      3%   (1.5% charity, 1% burn, 0.5% liquidity)
 *   Transfer fee:  0.5% (0.5% charity)
 *   Max wallet:    2% of total supply  (~490.52M)
 *   Max tx:        1% of total supply  (~245.26M)
 *
 * Fee-exempt addresses: owner, this contract, charity treasury, vesting, LP pair, zero address.
 */
contract POHToken is ERC20, Ownable, Pausable {
    // ── Supply ──────────────────────────────────────────────────────────
    uint256 public constant MAX_SUPPLY = 24_526_000_000 ether; // 24.526B with 18 decimals

    // ── Anti-whale ──────────────────────────────────────────────────────
    uint256 public maxWallet = (MAX_SUPPLY * 2) / 100;  // 2%
    uint256 public maxTx     = (MAX_SUPPLY * 1) / 100;  // 1%

    // ── Fee recipients ──────────────────────────────────────────────────
    address public charityWallet;
    address public liquidityWallet;

    // ── Fee basis points (100 = 1%) ─────────────────────────────────────
    // Buy fees
    uint256 public buyCharityFee   = 50;  // 0.5%
    uint256 public buyLiquidityFee = 50;  // 0.5%
    // Sell fees
    uint256 public sellCharityFee   = 150; // 1.5%
    uint256 public sellBurnFee      = 100; // 1.0%
    uint256 public sellLiquidityFee = 50;  // 0.5%
    // Transfer fee
    uint256 public transferCharityFee = 50; // 0.5%

    uint256 private constant FEE_DENOMINATOR = 10_000;

    // ── DEX pair tracking (for buy/sell detection) ──────────────────────
    mapping(address => bool) public isAutomatedMarketMaker;

    // ── Fee exemptions ──────────────────────────────────────────────────
    mapping(address => bool) public isFeeExempt;

    // ── Max-wallet exemptions ───────────────────────────────────────────
    mapping(address => bool) public isMaxWalletExempt;

    // ── Events ──────────────────────────────────────────────────────────
    event CharityWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event LiquidityWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event AMMPairUpdated(address indexed pair, bool indexed isAMM);
    event FeeExemptionUpdated(address indexed account, bool indexed exempt);
    event MaxWalletExemptionUpdated(address indexed account, bool indexed exempt);
    event TokensBurned(uint256 amount);
    event AntiWhaleUpdated(uint256 maxWallet, uint256 maxTx);

    // ── Constructor ─────────────────────────────────────────────────────
    constructor(
        address _charityWallet,
        address _liquidityWallet
    ) ERC20("Pursuit of Happiness", "POH") Ownable(msg.sender) {
        require(_charityWallet != address(0), "POH: charity wallet is zero");
        require(_liquidityWallet != address(0), "POH: liquidity wallet is zero");

        charityWallet = _charityWallet;
        liquidityWallet = _liquidityWallet;

        // Exempt core addresses from fees
        isFeeExempt[msg.sender] = true;
        isFeeExempt[address(this)] = true;
        isFeeExempt[_charityWallet] = true;
        isFeeExempt[_liquidityWallet] = true;

        // Exempt core addresses from max-wallet
        isMaxWalletExempt[msg.sender] = true;
        isMaxWalletExempt[address(this)] = true;
        isMaxWalletExempt[_charityWallet] = true;
        isMaxWalletExempt[_liquidityWallet] = true;
        isMaxWalletExempt[address(0)] = true; // burn address

        // Mint entire max supply to deployer for distribution
        _mint(msg.sender, MAX_SUPPLY);
    }

    // ── Transfer override (fees + anti-whale) ───────────────────────────
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override {
        // Paused check (allow minting and burning even when paused)
        if (from != address(0) && to != address(0)) {
            _requireNotPaused();
        }

        // Skip fees for exempt addresses, mints, and burns
        if (isFeeExempt[from] || isFeeExempt[to] || from == address(0) || to == address(0)) {
            // Anti-whale check on receives (even for exempt-fee addresses, unless max-wallet exempt)
            if (to != address(0) && !isMaxWalletExempt[to]) {
                require(balanceOf(to) + amount <= maxWallet, "POH: exceeds max wallet");
            }
            super._update(from, to, amount);
            return;
        }

        // Anti-whale: max transaction
        require(amount <= maxTx, "POH: exceeds max transaction");

        // Determine fee type
        uint256 charityAmount;
        uint256 burnAmount;
        uint256 liquidityAmount;

        if (isAutomatedMarketMaker[from]) {
            // ── BUY (from = pair) ──
            charityAmount   = (amount * buyCharityFee) / FEE_DENOMINATOR;
            liquidityAmount = (amount * buyLiquidityFee) / FEE_DENOMINATOR;
        } else if (isAutomatedMarketMaker[to]) {
            // ── SELL (to = pair) ──
            charityAmount   = (amount * sellCharityFee) / FEE_DENOMINATOR;
            burnAmount      = (amount * sellBurnFee) / FEE_DENOMINATOR;
            liquidityAmount = (amount * sellLiquidityFee) / FEE_DENOMINATOR;
        } else {
            // ── TRANSFER ──
            charityAmount = (amount * transferCharityFee) / FEE_DENOMINATOR;
        }

        uint256 totalFee = charityAmount + burnAmount + liquidityAmount;
        uint256 transferAmount = amount - totalFee;

        // Anti-whale: max wallet on receive
        if (!isMaxWalletExempt[to]) {
            require(balanceOf(to) + transferAmount <= maxWallet, "POH: exceeds max wallet");
        }

        // Execute transfers
        super._update(from, to, transferAmount);

        if (charityAmount > 0) {
            super._update(from, charityWallet, charityAmount);
        }
        if (liquidityAmount > 0) {
            super._update(from, liquidityWallet, liquidityAmount);
        }
        if (burnAmount > 0) {
            super._update(from, address(0), burnAmount);
            emit TokensBurned(burnAmount);
        }
    }

    // ── Admin: Pause / Unpause ──────────────────────────────────────────
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ── Admin: Update wallets ───────────────────────────────────────────
    function setCharityWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0), "POH: zero address");
        emit CharityWalletUpdated(charityWallet, _wallet);
        isFeeExempt[charityWallet] = false;
        isMaxWalletExempt[charityWallet] = false;
        charityWallet = _wallet;
        isFeeExempt[_wallet] = true;
        isMaxWalletExempt[_wallet] = true;
    }

    function setLiquidityWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0), "POH: zero address");
        emit LiquidityWalletUpdated(liquidityWallet, _wallet);
        isFeeExempt[liquidityWallet] = false;
        isMaxWalletExempt[liquidityWallet] = false;
        liquidityWallet = _wallet;
        isFeeExempt[_wallet] = true;
        isMaxWalletExempt[_wallet] = true;
    }

    // ── Admin: AMM pairs ────────────────────────────────────────────────
    function setAutomatedMarketMaker(address _pair, bool _isAMM) external onlyOwner {
        require(_pair != address(0), "POH: zero address");
        isAutomatedMarketMaker[_pair] = _isAMM;
        if (_isAMM) {
            isMaxWalletExempt[_pair] = true;
        }
        emit AMMPairUpdated(_pair, _isAMM);
    }

    // ── Admin: Fee exemptions ───────────────────────────────────────────
    function setFeeExempt(address _account, bool _exempt) external onlyOwner {
        isFeeExempt[_account] = _exempt;
        emit FeeExemptionUpdated(_account, _exempt);
    }

    function setMaxWalletExempt(address _account, bool _exempt) external onlyOwner {
        isMaxWalletExempt[_account] = _exempt;
        emit MaxWalletExemptionUpdated(_account, _exempt);
    }

    // ── Admin: Update anti-whale limits ─────────────────────────────────
    function setAntiWhaleLimits(uint256 _maxWallet, uint256 _maxTx) external onlyOwner {
        // Cannot set lower than 0.5% of max supply (prevents locking trading)
        require(_maxWallet >= MAX_SUPPLY / 200, "POH: max wallet too low");
        require(_maxTx >= MAX_SUPPLY / 200, "POH: max tx too low");
        maxWallet = _maxWallet;
        maxTx = _maxTx;
        emit AntiWhaleUpdated(_maxWallet, _maxTx);
    }

    // ── View: total fees ────────────────────────────────────────────────
    function totalBuyFee() external view returns (uint256) {
        return buyCharityFee + buyLiquidityFee;
    }

    function totalSellFee() external view returns (uint256) {
        return sellCharityFee + sellBurnFee + sellLiquidityFee;
    }
}
