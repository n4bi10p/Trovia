use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("11111111111111111111111111111111"); // Replace after first deploy

#[program]
pub mod agent_escrow {
    use super::*;

    /// Buyer activates an agent by paying the developer in SOL.
    /// Creates an Activation PDA as on-chain proof.
    pub fn activate_agent(
        ctx: Context<ActivateAgent>,
        agent_id: u64,
        user_config: String, // JSON string of buyer's runtime config
    ) -> Result<()> {
        let activation = &mut ctx.accounts.activation;
        let price_lamports = ctx.accounts.agent.price_lamports;

        // 1. Transfer SOL from buyer → developer
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.developer.to_account_info(),
            },
        );
        system_program::transfer(cpi_ctx, price_lamports)?;

        // 2. Record activation PDA
        activation.agent_id = agent_id;
        activation.buyer = ctx.accounts.buyer.key();
        activation.config = user_config.clone();
        activation.activated_at = Clock::get()?.unix_timestamp;
        activation.is_active = true;
        activation.bump = ctx.bumps.activation;

        // 3. Emit event (indexed by agent_id + buyer for off-chain listeners)
        emit!(AgentActivated {
            agent_id,
            buyer: ctx.accounts.buyer.key(),
            developer: ctx.accounts.developer.key(),
            price_lamports,
            config: user_config,
            timestamp: activation.activated_at,
        });

        Ok(())
    }

    /// Deactivates an agent for a user. Only buyer can call.
    pub fn deactivate_activation(ctx: Context<DeactivateActivation>, _agent_id: u64) -> Result<()> {
        let activation = &mut ctx.accounts.activation;
        require!(activation.buyer == ctx.accounts.buyer.key(), EscrowError::Unauthorized);
        activation.is_active = false;
        Ok(())
    }
}

// ── Accounts ──────────────────────────────────────────────────────────────────

/// Minimal view of the Agent account from agent_registry program (for price check)
#[account]
pub struct Agent {
    pub id: u64,
    pub name: String,
    pub description: String,
    pub agent_type: String,
    pub price_lamports: u64,
    pub developer: Pubkey,
    pub is_active: bool,
    pub config_schema: String,
    pub created_at: i64,
}

#[account]
pub struct Activation {
    pub agent_id: u64,
    pub buyer: Pubkey,
    pub config: String,      // buyer's runtime config JSON
    pub activated_at: i64,
    pub is_active: bool,
    pub bump: u8,
}

// ── Contexts ──────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(agent_id: u64)]
pub struct ActivateAgent<'info> {
    #[account(
        init,
        payer = buyer,
        space = 8 + 8 + 32 + 516 + 8 + 1 + 1,
        seeds = [b"activation", buyer.key().as_ref(), agent_id.to_le_bytes().as_ref()],
        bump
    )]
    pub activation: Account<'info, Activation>,

    /// CHECK: We only read price_lamports and developer from this account
    #[account(
        seeds = [b"agent", agent_id.to_le_bytes().as_ref()],
        bump,
        seeds::program = agent_registry_program.key()
    )]
    pub agent: Account<'info, Agent>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: This is the developer wallet that receives payment
    #[account(mut, address = agent.developer)]
    pub developer: UncheckedAccount<'info>,

    /// CHECK: The agent_registry program id
    pub agent_registry_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(agent_id: u64)]
pub struct DeactivateActivation<'info> {
    #[account(
        mut,
        seeds = [b"activation", buyer.key().as_ref(), agent_id.to_le_bytes().as_ref()],
        bump = activation.bump
    )]
    pub activation: Account<'info, Activation>,

    pub buyer: Signer<'info>,
}

// ── Events ────────────────────────────────────────────────────────────────────

#[event]
pub struct AgentActivated {
    pub agent_id: u64,
    pub buyer: Pubkey,
    pub developer: Pubkey,
    pub price_lamports: u64,
    pub config: String,
    pub timestamp: i64,
}

// ── Errors ────────────────────────────────────────────────────────────────────

#[error_code]
pub enum EscrowError {
    #[msg("Only the buyer can modify this activation.")]
    Unauthorized,
    #[msg("Agent is not active.")]
    AgentInactive,
}
