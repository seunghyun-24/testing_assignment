use std::collections::{BTreeMap, HashMap, HashSet};
use quote::ToTokens;
use serde::de::value::CowStrDeserializer;
use syn::{spanned::Spanned, visit::{self, Visit}, Block, Expr, ExprIf, File, ItemFn, Stmt};
use std::fs;

struct Coverage {
    func_cov: BTreeMap<usize, (String, (usize, usize, usize, usize))>,
    stmt_cov: BTreeMap<usize, (usize, usize, usize, usize)>,
    branch_cov: BTreeMap<usize, (usize, usize, usize, usize)>,
    func_total: usize,
    stmt_total: usize,
    branch_total: usize,
}

impl Coverage {
    fn new() -> Self {
        Self {
            func_cov: BTreeMap::new(),
            stmt_cov: BTreeMap::new(),
            branch_cov: BTreeMap::new(),
            func_total: 0,
            stmt_total: 0,
            branch_total: 0,
        }
    }

    fn report(&self) {
        println!("Coverage:");
        println!("- func: {}/{} ({:.2}%)", self.func_cov.len(), self.func_total, 
                 self.func_cov.len() as f64 / self.func_total as f64 * 100.0);
        for (idx, (name, (start_l, start, end_l, end))) in &self.func_cov {
            println!("  - {}: {}: {}:{}-{}:{}", idx, name, start_l, start, end_l, end);
        }
        println!("- stmt: {}/{} ({:.2}%)", self.stmt_cov.len(), self.stmt_total, 
                 self.stmt_cov.len() as f64 / self.stmt_total as f64 * 100.0);
        for (idx, (start_l, start, end_l, end)) in &self.stmt_cov {
            println!("  - {}: {}:{}-{}:{}", idx, start_l, start, end_l, end);
        }
        println!("- branch: {}/{} ({:.2}%)", self.branch_cov.len(), self.branch_total, 
                 self.branch_cov.len() as f64 / self.branch_total as f64 * 100.0);
        for (idx, (start_l, start, end_l, end)) in &self.branch_cov {
            println!("  - {}: {}:{}-{}:{}", idx, start_l, start, end_l, end);
        }
    }
}

struct CoverageVisitor {
    coverage: Coverage,
    current_func: usize,
    current_stmt: usize,
    current_branch: usize,
}

impl<'ast> Visit<'ast> for CoverageVisitor {
    fn visit_item_fn(&mut self, item_fn: &'ast syn::ItemFn) {
        let fn_name = item_fn.sig.ident.to_string();
        //let fn_source_code = item_fn.span().source_text().unwrap();
        let span_start_line = item_fn.span().start().line;
        let span_start = item_fn.span().start().column;
        let span_end_line = item_fn.span().end().line;
        let span_end = item_fn.span().end().column;

        self.current_func += 1;
        self.coverage.func_total += 1;
        self.coverage.func_cov.insert(self.current_func, (fn_name, (span_start_line, span_start, span_end_line, span_end)));

        visit::visit_item_fn(self, item_fn);
    }

    fn visit_stmt(&mut self, s: &'ast Stmt) {
        let span_start_line = s.span().start().line;
        let span_start = s.span().start().column;
        let span_end_line = s.span().end().line;
        let span_end = s.span().end().column;

        self.current_stmt += 1;
        self.coverage.stmt_total += 1;
        self.coverage.stmt_cov.insert(self.current_stmt, (span_start_line, span_start, span_end_line, span_end));

        visit::visit_stmt(self, s);
    }

    fn visit_expr_if(&mut self, i: &'ast ExprIf) {
        let span_start_line = i.span().start().line;
        let span_start = i.span().start().column;
        let span_end_line = i.span().end().line;
        let span_end = i.span().end().column;

        self.current_branch += 1;
        self.coverage.branch_total += 1;
        self.coverage.branch_cov.insert(self.current_branch, (span_start_line, span_start, span_end_line, span_end));

        visit::visit_expr_if(self, i);
    }
    
    fn visit_block(&mut self, i: &'ast syn::Block) {
        let span_start = i.span().start().line;
        let span_end = i.span().end().line;

        visit::visit_block(self, i);
    }

    fn visit_expr_loop(&mut self, i: &'ast syn::ExprLoop) {
        let span_start = i.span().start().line;
        let span_end = i.span().end().line;

        visit::visit_expr_loop(self, i);
    }

}

fn main() {
    let contents = fs::read_to_string("example/sort.rs").expect("Something went wrong reading the file");
    let syntax = syn::parse_file(&contents).expect("Unable to parse file");

    let mut visitor = CoverageVisitor {
        coverage: Coverage::new(),
        current_func: 0,
        current_stmt: 0,
        current_branch: 0,
    };
    visitor.visit_file(&syntax);

    visitor.coverage.report();
}
