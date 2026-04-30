use anchor_lang::prelude::*;

declare_id!("9MdQSwiyHCCRMSNQeBq2ABttxewTUNmWCXWvDwJF4sD6"); // Replace after first deploy

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
        require!(action.as_bytes().len() <= 64, ExecutorError::ActionTooLong);
        require!(result.as_bytes().len() <= 512, ExecutorError::ResultTooLong);

        let timestamp = Clock::get()?.unix_timestamp;

        emit!(ExecutionLogged {
            agent_id,
            user: ctx.accounts.user.key(),
            action,
            result,
            timestamp,
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
pub struct LogExecution<'info> {
    pub user: Signer<'info>,
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

#[error_code]
pub enum ExecutorError {
    #[msg("Execution action is too long.")]
    ActionTooLong,
    #[msg("Execution result is too long.")]
    ResultTooLong,
}
