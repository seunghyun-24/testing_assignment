fn func_func(a: i32, b: i32) -> i32 {
    fn abs(x: i32) -> i32 {
        if x >= 0 {
            return x;
        }
        -x
    }

    fn twice<F>(f: F) -> impl Fn(i32) -> i32
    where
        F: Fn(i32) -> i32,
    {
        move |x| f(f(x))
    }

    fn add_n(n: i32) -> impl Fn(i32) -> i32 {
        move |x| x + n
    }

    let _ = twice(add_n(a));

    abs(b)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_m1_p3() {
        assert_eq!(func_func(-1, 3), 3);
    }
    
    #[test]
    fn test_p3_p9() {
        assert_eq!(func_func(3, 9), 9);
    }

    #[test]
    fn test_p3_p5() {
        assert_eq!(func_func(3, 5), 5);
    }

    #[test]
    fn test_p5_m2() {
        assert_eq!(func_func(5, -2), 2);
    }
}