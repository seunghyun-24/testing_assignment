use std::collections::{BTreeMap, HashMap, HashSet};
use quote::ToTokens;
use serde::de::value::CowStrDeserializer;
use syn::{spanned::Spanned, visit::{self, Visit}, Block, Expr, ExprIf, ExprLet, File, ItemFn, Local, Stmt};
use std::fs;

struct Coverage {
    func_cov: BTreeMap<usize, (String, (usize, usize, usize, usize))>,
    stmt_cov: BTreeMap<usize, (usize, usize, usize, usize)>,
    branch_cov: BTreeMap<usize, (usize, usize, usize, usize)>,

    loop_cov: BTreeMap<usize, (usize, usize, usize, usize)>,
    macro_cov: BTreeMap<usize, (usize, usize, usize, usize)>,

    func_total: usize,
    stmt_total: usize,
    branch_total: usize,

    loop_total: usize,
    macro_total: usize,
}

impl Coverage {
    fn new() -> Self {
        Self {
            func_cov: BTreeMap::new(),
            stmt_cov: BTreeMap::new(),
            branch_cov: BTreeMap::new(),

            loop_cov: BTreeMap::new(),
            macro_cov: BTreeMap::new(),

            func_total: 0,
            stmt_total: 0,
            branch_total: 0,

            loop_total: 0,
            macro_total: 0,
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

        println!("\nFor detail check:");
        println!("- loop: {}/{} ({:.2}%)", self.loop_cov.len(), self.loop_total, 
                 self.loop_cov.len() as f64 / self.loop_total as f64 * 100.0);
        for (idx, (start_l, start, end_l, end)) in &self.loop_cov {
            println!("  - {}: {}:{}-{}:{}", idx, start_l, start, end_l, end);
        }
        println!("- macro: {}/{} ({:.2}%)", self.macro_cov.len(), self.macro_total, 
                 self.macro_cov.len() as f64 / self.macro_total as f64 * 100.0);
        for (idx, (start_l, start, end_l, end)) in &self.macro_cov {
            println!("  - {}: {}:{}-{}:{}", idx, start_l, start, end_l, end);
        }

    }
}

struct CoverageVisitor {
    coverage: Coverage,
    current_func: usize,
    current_stmt: usize,
    current_branch: usize,
    
    current_loop: usize,
    current_macro: usize,
}

impl<'ast> Visit<'ast> for CoverageVisitor {
    fn visit_item_fn(&mut self, item_fn: &'ast ItemFn) {
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

    // 이걸로 Let 에 해당하는 애들 다 찾을 수 있음. 
    // for i in 0..len { 에서 i도 이걸로 접근 가능!
    // fn visit_pat_ident(&mut self, i: &'ast syn::PatIdent) {

    //     let span_start_line = i.span().start().line;
    //     let span_start = i.span().start().column;
    //     let span_end_line = i.span().end().line;
    //     let span_end = i.span().end().column;

    //     println!(">{}", i.to_token_stream().to_string());
    //     self.current_stmt += 1;
    //     self.coverage.stmt_total += 1;
    //     self.coverage.stmt_cov.insert(self.current_stmt, (span_start_line, span_start, span_end_line, span_end));

    //     visit::visit_pat_ident(self, i);
    // }
    
    // min=j
    // fn visit_expr_assign(&mut self, i: &'ast syn::ExprAssign) {
    //     let span_start_line = i.span().start().line;
    //     let span_start = i.span().start().column;
    //     let span_end_line = i.span().end().line;
    //     let span_end = i.span().end().column;

    //     println!("{}", i.to_token_stream().to_string());
    //     self.current_stmt += 1;
    //     self.coverage.stmt_total += 1;
    //     self.coverage.stmt_cov.insert(self.current_stmt, (span_start_line, span_start, span_end_line, span_end));

    //     visit::visit_expr_assign(self, i);
    // }

    // 이걸 하면 let a = 1; 여기서 1의 위치를 명확하게 파악할 수 있음
    // fn visit_local_init(&mut self, s: &'ast syn::LocalInit) {
    //     let span_start_line = s.expr.span().start().line;
    //     let span_start = s.expr.span().start().column;
    //     let span_end_line = s.expr.span().end().line;
    //     let span_end = s.expr.span().end().column;

    //     self.current_stmt += 1;
    //     self.coverage.stmt_total += 1;
    //     self.coverage.stmt_cov.insert(self.current_stmt, (span_start_line, span_start, span_end_line, span_end));

    //     visit::visit_local_init(self, s);
    // }
    
    fn visit_expr_if(&mut self, i: &'ast ExprIf) {
        let span_start_line = i.cond.span().start().line;
        let span_start = i.cond.span().start().column;
        let span_end_line = i.cond.span().end().line;
        let span_end = i.cond.span().end().column;

        self.current_branch += 1;
        self.coverage.branch_total += 1;
        self.coverage.branch_cov.insert(self.current_branch, (span_start_line, span_start, span_end_line, span_end));
        
        visit::visit_expr(self, &i.cond);

        visit::visit_block(self, &i.then_branch);
        if let Some((_, else_branch)) = &i.else_branch {
            visit::visit_expr(self, else_branch);
        }

        //visit::visit_expr_if(self, i); 얘는 그냥 if문부터 else 끝까지를 가리킬 때 사용하게 됨
    }

    fn visit_expr_match(&mut self, i: &syn::ExprMatch) {
        let span_start_line = i.span().start().line;
        let span_start = i.span().start().column;
        let span_end_line = i.span().end().line;
        let span_end = i.span().end().column;

        self.current_branch += 1;
        self.coverage.branch_total += 1;
        self.coverage.branch_cov.insert(self.current_branch, (span_start_line, span_start, span_end_line, span_end));

        syn::visit::visit_expr_match(self, i);
    }


    fn visit_expr_loop(&mut self, i: &'ast syn::ExprLoop) {
        let span_start_line = i.span().start().line;
        let span_start = i.span().start().column;
        let span_end_line = i.span().end().line;
        let span_end = i.span().end().column;

        self.current_loop += 1;
        self.coverage.loop_total += 1;
        self.coverage.loop_cov.insert(self.current_loop, (span_start_line, span_start, span_end_line, span_end));

        visit::visit_expr_loop(self, i);
    }

    fn visit_expr_while(&mut self, i: &'ast syn::ExprWhile) {
        let span_start_line = i.span().start().line;
        let span_start = i.span().start().column;
        let span_end_line = i.span().end().line;
        let span_end = i.span().end().column;

        self.current_loop += 1;
        self.coverage.loop_total += 1;
        self.coverage.loop_cov.insert(self.current_loop, (span_start_line, span_start, span_end_line, span_end));

        visit::visit_expr_while(self, i);
    }

    fn visit_expr_for_loop(&mut self, i: &'ast syn::ExprForLoop) {
        let span_start_line = i.span().start().line;
        let span_start = i.span().start().column;
        let span_end_line = i.span().end().line;
        let span_end = i.span().end().column;

        self.current_loop += 1;
        self.coverage.loop_total += 1;
        self.coverage.loop_cov.insert(self.current_loop, (span_start_line, span_start, span_end_line, span_end));

        visit::visit_expr_for_loop(self, i);
    }

    // 얘는 딱 범위만 가리키는 애인듯 하다. loop에 넣으면 X
    // fn visit_expr_range(&mut self, i: &'ast syn::ExprRange) {
    //     let span_start_line = i.span().start().line;
    //     let span_start = i.span().start().column;
    //     let span_end_line = i.span().end().line;
    //     let span_end = i.span().end().column;

    //     self.current_loop += 1;
    //     self.coverage.loop_total += 1;
    //     self.coverage.loop_cov.insert(self.current_loop, (span_start_line, span_start, span_end_line, span_end));

    //     visit::visit_expr_range(self, i);
    // }



    fn visit_stmt_macro(&mut self, i: &'ast syn::StmtMacro) {
        let span_start_line = i.span().start().line;
        let span_start = i.span().start().column;
        let span_end_line = i.span().end().line;
        let span_end = i.span().end().column;

        self.current_macro += 1;
        self.coverage.macro_total += 1;
        self.coverage.macro_cov.insert(self.current_macro, (span_start_line, span_start, span_end_line, span_end));

        visit::visit_stmt_macro(self, i);
    
    }
}

fn main() {
    let contents = fs::read_to_string("example/branch.rs").expect("Something went wrong reading the file");
    let syntax = syn::parse_file(&contents).expect("Unable to parse file");

    let mut visitor = CoverageVisitor {
        coverage: Coverage::new(),
        current_func: 0,
        current_stmt: 0,
        current_branch: 0,

        current_loop: 0,
        current_macro: 0,
    };
    visitor.visit_file(&syntax);

    visitor.coverage.report();
}
