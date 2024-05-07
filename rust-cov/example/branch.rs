pub fn branch(fname: &str, arg: i32) -> Option<i32> {
  let funcs: std::collections::HashMap<&str, fn(i32) -> i32> = [
      ("cond", |x| {
          let mut b = x < 0;
          b = b && b;
          b = b || b;
          b = b || !b;
          b = if b { b } else { !b };
          b as i32 // Simplified for Rust's type system
      }),
      ("abs", |x| {
          if x >= 0 { x } else { -x }
      }),
      ("shortAbs", |x| {
          if x >= 0 { x } else { -x }
      }),
  ].iter().cloned().collect();

  funcs.get(fname).map(|f| f(arg))
}
