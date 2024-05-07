fn sort(array: &mut [i32]) {
  for i in 0..array.len() {
      let mut min = i;
      for j in (i + 1)..array.len() {
          if array[min] > array[j] {
              min = j;
          }
      }
      if min != i {
          array.swap(i, min);
      }
  }
}

fn main() {
  let mut data = vec![[1,2,3]];
  println!("Original: {:?}", data);
  sort(&mut data);
  println!("Sorted: {:?}", data);
}
