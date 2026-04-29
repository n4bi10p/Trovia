use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111"); // Replace after first deploy

#[program]
pub mod agent_executor {
    use super::*;

    /// Logs an agent execution result on-chain.
    /// Called by the backend server after each agent execution.
    pub fn log_execution(
        ctx: Context<LogExecution>,
        agent_id: u64,
        action: String,  // e.g. "threshold_alert" | "content_reply" | "payment_sent"
        result: String,  // JSON summary string
    ) -> Result<()> {
        let log = &mut ctx.accounts.execution_log;

        log.agent_id = agent_id;
        log.user = ctx.accounts.user.key();
        log.action = action.clone();
        log.result = result.clone();
        log.timestamp = Clock::get()?.unix_timestamp;
        log.bump = ctx.bumps.execution_log;

        emit!(ExecutionLogged {
            agent_id,
            user: ctx.accounts.user.key(),
            action,
            result,
            timestamp: log.timestamp,
        });

        Ok(())
    }
}

// ── Accounts ──────────────────────────────────────────────────────────────────

#[account]
pub struct ExecutionLog {
    pub agent_id: u64,
    pub user: Pubkey,
    pub action: String,    // max 64 chars
    pub result: String,    // max 512 chars (JSON summary)
    pub timestamp: i64,
    pub bump: u8,
}

// ── Contexts ──────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(agent_id: u64, action: String)]
pub struct LogExecution<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 8 + 32 + 68 + 516 + 8 + 1,
        seeds = [
            b"execution",
            user.key().as_ref(),
            agent_id.to_le_bytes().as_ref(),
            Clock::get().unwrap().unix_timestamp.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub execution_log: Account<'info, ExecutionLog>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ── Events ────────────────────────────────────────────────────────────────────

#[event]
pub struct ExecutionLogged {
    pub agent_id: u64,
    pub user: Pubkey,
    pub action: String,
    pub result: String,
    pub timestamp: i64,
}
