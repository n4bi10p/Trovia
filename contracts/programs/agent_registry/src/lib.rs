use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111"); // Replace after first deploy

#[program]
pub mod agent_registry {
    use super::*;

    /// Publishes a new agent to the registry.
    /// Called by the developer wallet.
    pub fn publish_agent(ctx: Context<PublishAgent>, args: PublishAgentArgs) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        let registry = &mut ctx.accounts.registry;

        agent.id = registry.agent_count;
        agent.name = args.name;
        agent.description = args.description;
        agent.agent_type = args.agent_type;
        agent.price_lamports = args.price_lamports;
        agent.developer = ctx.accounts.developer.key();
        agent.is_active = true;
        agent.config_schema = args.config_schema;
        agent.created_at = Clock::get()?.unix_timestamp;

        registry.agent_count += 1;

        emit!(AgentPublished {
            id: agent.id,
            name: agent.name.clone(),
            developer: agent.developer,
            price_lamports: agent.price_lamports,
        });

        Ok(())
    }

    /// Deactivates an agent. Only the developer can call this.
    pub fn deactivate_agent(ctx: Context<DeactivateAgent>, _id: u64) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        require!(agent.developer == ctx.accounts.developer.key(), TroviaError::Unauthorized);
        agent.is_active = false;
        Ok(())
    }
}

// ── Accounts ──────────────────────────────────────────────────────────────────

#[account]
pub struct Registry {
    pub agent_count: u64,      // total agents ever published
    pub bump: u8,
}

#[account]
pub struct Agent {
    pub id: u64,
    pub name: String,          // max 64 chars
    pub description: String,   // max 256 chars
    pub agent_type: String,    // "trading"|"farming"|"scheduling"|"rebalancing"|"content"|"business"
    pub price_lamports: u64,   // payment required to activate
    pub developer: Pubkey,     // wallet that published — receives payment
    pub is_active: bool,
    pub config_schema: String, // JSON string of required config fields
    pub created_at: i64,
}

// ── Args ──────────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PublishAgentArgs {
    pub name: String,
    pub description: String,
    pub agent_type: String,
    pub price_lamports: u64,
    pub config_schema: String,
}

// ── Contexts ──────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct PublishAgent<'info> {
    #[account(
        init,
        payer = developer,
        space = 8 + 8 + 68 + 260 + 20 + 8 + 32 + 1 + 512 + 8,
        seeds = [b"agent", registry.agent_count.to_le_bytes().as_ref()],
        bump
    )]
    pub agent: Account<'info, Agent>,

    #[account(
        mut,
        seeds = [b"registry"],
        bump = registry.bump
    )]
    pub registry: Account<'info, Registry>,

    #[account(mut)]
    pub developer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(id: u64)]
pub struct DeactivateAgent<'info> {
    #[account(
        mut,
        seeds = [b"agent", id.to_le_bytes().as_ref()],
        bump
    )]
    pub agent: Account<'info, Agent>,

    pub developer: Signer<'info>,
}

// ── Events ────────────────────────────────────────────────────────────────────

#[event]
pub struct AgentPublished {
    pub id: u64,
    pub name: String,
    pub developer: Pubkey,
    pub price_lamports: u64,
}

// ── Errors ────────────────────────────────────────────────────────────────────

#[error_code]
pub enum TroviaError {
    #[msg("You are not the developer of this agent.")]
    Unauthorized,
}
