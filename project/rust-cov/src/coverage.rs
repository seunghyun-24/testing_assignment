use std::collections::{HashMap, HashSet};
use syn::{visit::{self, Visit}, File, Stmt, ItemFn, ExprIf, Block};
use quote::ToTokens;

pub struct Coverage {
    pub functions: HashMap<usize, String>,
    pub statements: HashMap<usize, String>,
    pub branches: HashMap<usize, (String, String)>,
    pub func_coverage: HashSet<usize>,
    pub stmt_coverage: HashSet<usize>,
    pub branch_coverage: HashSet<usize>,
    next_id: usize,
}

impl Coverage {
    pub fn new() -> Self {
        Self {
            functions: HashMap::new(),
            statements: HashMap::new(),
            branches: HashMap::new(),
            func_coverage: HashSet::new(),
            stmt_coverage: HashSet::new(),
            branch_coverage: HashSet::new(),
            next_id: 0,
        }
    }

    pub fn execute_path(&mut self, array: &[i32]) {
        // Track coverage based on conditional logic detected during the sort
        if array.len() > 1 {
            self.stmt_coverage.insert(1); // Suppose ID 1 is for the first comparison statement
            self.branch_coverage.insert(1); // Suppose ID 1 is for the first branch in a comparison
        }
    }

    pub fn add_function(&mut self, tokens: String) {
        let id = self.gen_id();
        self.functions.insert(id, tokens);
        self.func_coverage.insert(id);
    }

    pub fn add_statement(&mut self, tokens: String) {
        let id = self.gen_id();
        self.statements.insert(id, tokens);
        self.stmt_coverage.insert(id);
    }

    pub fn add_branch(&mut self, condition: String, outcome: String) {
        let id = self.gen_id();
        self.branches.insert(id, (condition, outcome));
        self.branch_coverage.insert(id);
    }

    fn gen_id(&mut self) -> usize {
        let id = self.next_id;
        self.next_id += 1;
        id
    }

    pub fn report(&self) {
        println!("Coverage:");
        println!("- func: {}/{} ({:.2}%)", self.func_coverage.len(), self.functions.len(), 
                 self.func_coverage.len() as f64 / self.functions.len() as f64 * 100.0);
        println!("- stmt: {}/{} ({:.2}%)", self.stmt_coverage.len(), self.statements.len(), 
                 self.stmt_coverage.len() as f64 / self.statements.len() as f64 * 100.0);
        println!("- branch: {}/{} ({:.2}%)", self.branch_coverage.len(), self.branches.len(), 
                 self.branch_coverage.len() as f64 / self.branches.len() as f64 * 100.0);
    }
}

struct CoverageVisitor {
    coverage: Coverage,
}

impl<'ast> Visit<'ast> for CoverageVisitor {
    fn visit_item_fn(&mut self, i: &'ast ItemFn) {
        let signature = i.sig.to_token_stream().to_string();
        self.coverage.add_function(signature);
        visit::visit_item_fn(self, i);
    }

    fn visit_stmt(&mut self, s: &'ast Stmt) {
        let stmt_tokens = s.to_token_stream().to_string();
        self.coverage.add_statement(stmt_tokens);
        visit::visit_stmt(self, s);
    }

    fn visit_expr_if(&mut self, i: &'ast ExprIf) {
        let condition = i.cond.to_token_stream().to_string();
        let outcome = match &i.then_branch {
            Block(block, _) => block.to_token_stream().to_string(),
            _ => String::new(),
        };
        self.coverage.add_branch(condition, outcome);
        visit::visit_expr_if(self, i);
    }
}
