// #[allow(dead_code)]

pub fn function_branch(fname: &str, arg: i32) -> Option<i32> {
    match fname {
        "cond" => {
            let mut b = arg < 0;
            b = b && b;
            b = b || b;
            b = b;
            //b = b.unwrap_or(b); 
            b = !b;
            b = if b { b } else { b };
            
            Some(if b { 0 } else { 1 })
        },
        "abs" => {
            if arg >= 0 {
                Some(arg)
            } else {
                Some(-arg)
            }
        },
        "shortAbs" => Some(if arg >= 0 { arg } else { -arg }),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // #[test]
    // fn test_cond() {
    //     assert_eq!(function_branch("cond", 5), Some(0));
    // }

    #[test]
    fn test_abs() {
        assert_eq!(function_branch("abs", 5), Some(5));
    }

    #[test]
    fn test_short_abs() {
        assert_eq!(function_branch("shortAbs", -5), Some(5));
    }

    #[test]
    fn test_unknown() {
        assert_eq!(function_branch("unknown", 42), None);
    }

}