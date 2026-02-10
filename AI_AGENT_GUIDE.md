# AI Agent Integration Guide

This guide helps AI agents interact with the Raffle Party Platform safely and efficiently.

## Quick Start

### Get Validation Rules (Machine-Readable)
```bash
curl http://localhost:3000/api/validation-rules
```

This endpoint returns all validation rules in JSON format, including:
- Parameter constraints
- Error messages
- Valid/invalid examples
- Gas optimization hints

## Creating a Raffle

### Required Parameters

```typescript
interface CreateRaffleParams {
  title: string;              // 3-100 characters
  description: string;        // 10-500 characters
  entryFee: number;          // 0 < entryFee <= 100 (ETH)
  maxParticipants: number;   // 0 (unlimited) OR 2-10000
  deadline: number;          // Unix timestamp (future, within 365 days)
}
```

### Critical Validation Rules ⚠️

**Entry Fee:**
- ✅ Must be greater than 0
- ✅ Must be less than or equal to 100 ETH
- ❌ Cannot be 0, negative, or > 100

**Max Participants:**
- ✅ Use `0` for unlimited participants
- ✅ Use `2` to `10000` for limited participants
- ❌ **NEVER use `1`** - single-participant raffles are not allowed
- ❌ Cannot exceed 10,000 (gas DoS protection)

**Deadline:**
- ✅ Must be in the future (timestamp > now)
- ✅ Must be within 365 days from now
- ❌ Cannot be in the past or > 365 days away

### Example: Valid Raffle Creation

```json
{
  "title": "0.1 ETH Community Raffle",
  "description": "Join our weekly community raffle! Winner takes all.",
  "entryFee": "0.1",
  "maxParticipants": "100",
  "deadline": "2026-03-01T12:00:00Z"
}
```

### Example: Invalid Attempts (Will Fail)

```json
// ❌ INVALID: maxParticipants = 1
{
  "entryFee": "0.1",
  "maxParticipants": "1",  // ERROR: MinParticipantsTooLow
  "deadline": "2026-03-01T12:00:00Z"
}

// ❌ INVALID: entryFee > 100
{
  "entryFee": "150",  // ERROR: EntryFeeTooHigh
  "maxParticipants": "50",
  "deadline": "2026-03-01T12:00:00Z"
}

// ❌ INVALID: maxParticipants > 10000
{
  "entryFee": "0.01",
  "maxParticipants": "15000",  // ERROR: MaxParticipantsTooHigh
  "deadline": "2026-03-01T12:00:00Z"
}

// ❌ INVALID: deadline > 365 days
{
  "entryFee": "0.1",
  "maxParticipants": "100",
  "deadline": "2028-01-01T12:00:00Z"  // ERROR: DeadlineTooFar
}
```

## Creation Fee Calculation

The platform charges a 1% creation fee based on total payout:

```
fee = min(max(entryFee * maxParticipants * 0.01, 0.0004), 0.05)
```

- Minimum: 0.0004 ETH
- Maximum: 0.05 ETH
- Unlimited raffles (maxParticipants=0) pay max fee: 0.05 ETH

### Examples:
- `entryFee=0.01, maxParticipants=10`: fee = **0.0004 ETH** (min cap)
- `entryFee=0.1, maxParticipants=100`: fee = **0.01 ETH**
- `entryFee=1, maxParticipants=1000`: fee = **0.05 ETH** (max cap)
- `entryFee=0.1, maxParticipants=0`: fee = **0.05 ETH** (unlimited = max)

## Contract Addresses

### Base Sepolia (Testnet)
```
RaffleFactory: 0x12B290Ee2b741f700337680bC781492b7F2BFE37
Chain ID: 84532
```

## Smart Contract Errors

If validation fails on-chain, you'll receive one of these custom errors:

| Error | Cause | Solution |
|-------|-------|----------|
| `EntryFeeMustBePositive` | Entry fee ≤ 0 | Use value > 0 |
| `EntryFeeTooHigh` | Entry fee > 100 ETH | Use value ≤ 100 ETH |
| `MinParticipantsTooLow` | maxParticipants = 1 | Use 0 or ≥ 2 |
| `MaxParticipantsTooHigh` | maxParticipants > 10000 | Use ≤ 10000 |
| `DeadlineMustBeInFuture` | Deadline ≤ now | Use future timestamp |
| `DeadlineTooFar` | Deadline > now + 365d | Use ≤ 365 days |
| `InsufficientCreationFee` | Sent ETH < required fee | Send correct creation fee |

## Best Practices for AI Agents

1. **Always validate client-side first** - Check rules before sending transaction to save gas
2. **Query `/api/validation-rules`** - Get latest rules programmatically
3. **Handle errors gracefully** - Catch and parse custom error messages
4. **Test on testnet first** - Use Base Sepolia before mainnet
5. **Monitor gas prices** - Wait for lower gas if not urgent
6. **Use unlimited carefully** - `maxParticipants=0` charges max creation fee

## Security Features (v2.0)

✅ No `tx.origin` vulnerability
✅ Uses `.call{}` instead of `.transfer()` (smart wallet compatible)
✅ ReentrancyGuard on prize claims
✅ Input validation bounds
✅ Emergency pause mechanism
✅ Custom errors (gas efficient)

## Support

- GitHub Issues: https://github.com/your-repo/issues
- Documentation: http://localhost:3000/docs
- Validation API: http://localhost:3000/api/validation-rules

---

**Last Updated:** February 9, 2026
**Contract Version:** v2.0-security-fixes
**Network:** Base Sepolia (Testnet)
